const ContractorModel = require("../models/contractorModel");
const UserModel = require("../models/userModel");
const whatsappService = require("../services/whatsappService");
const { successRes, errorRes } = require("../utils/helpers");

const ContractorController = {
  // Register or Upgrade User to Contractor in Database
  registerContractor: async (req, res) => {
    try {
      const { name, phone, password, company_name, trade_specialization, city } = req.body;

      if (req.user) {
        // Logged-in user upgrading to contractor
        const userId = req.user.id;
        const targetRole = req.user.role === "seller" || req.user.role === "admin" ? req.user.role : "contractor";
        await UserModel.update(userId, {
          role: targetRole,
          company_name: company_name || req.user.company_name || null,
          trade_specialization: trade_specialization || null,
          city: city || req.user.city || null,
          is_verified_contractor: 1,
        });

        const updatedUser = await UserModel.findById(userId);
        return successRes(res, { user: updatedUser }, "Successfully registered as a Contractor");
      } else {
        // Guest user registering new Contractor account directly
        if (!name || !phone || !password) {
          return errorRes(res, "Name, Phone Number, and Password are required to create a new Contractor account.", 400);
        }

        const existingPhone = await UserModel.findByPhone(phone);
        if (existingPhone) {
          return errorRes(res, "This phone number is already registered. Please log in first.", 400);
        }

        const bcrypt = require("bcryptjs");
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUserId = await UserModel.create({
          name,
          phone,
          hashedPassword,
          role: "contractor",
        });

        await UserModel.update(newUserId, {
          company_name: company_name || null,
          trade_specialization: trade_specialization || null,
          city: city || null,
          is_verified_contractor: 1,
        });

        const { generateToken } = require("../utils/jwtUtils");
        const token = generateToken({ id: newUserId, role: "contractor" });

        res.cookie("authToken", token, {
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        const newUser = await UserModel.findById(newUserId);
        return successRes(res, { user: newUser, token }, "Successfully registered as a Contractor", 201);
      }
    } catch (err) {
      console.error("registerContractor error:", err);
      return errorRes(res, err.message || "Failed to register contractor", 500);
    }
  },

  // Create Site Post (Supports Logged-in Contractor or 1-Time Guest Post)
  createPost: async (req, res) => {
    try {
      const {
        post_type,
        title,
        company_name,
        contact_name,
        contact_phone,
        whatsapp_phone,
        site_address,
        city,
        state,
        pincode,
        lat,
        lng,
        start_date,
        end_date,
        amenities,
        description,
        requirements,
      } = req.body;

      if (!title || !contact_name || !contact_phone || !site_address || !city || !start_date || !end_date) {
        return errorRes(res, "Missing required post fields (Title, Contact Name, Phone, Address, City, Dates)", 400);
      }

      let contractorId = req.user ? req.user.id : null;
      if (!contractorId && contact_phone) {
        try {
          const { pool } = require("../config/db");
          const [uRows] = await pool.query("SELECT id FROM users WHERE phone = ?", [contact_phone]);
          if (uRows.length > 0) {
            contractorId = uRows[0].id;
          }
        } catch (e) {
          console.error("Phone lookup failed:", e);
        }
      }

      // If user is logged in, use their company name if not provided
      const postData = {
        contractor_id: contractorId,
        post_type: post_type || "demand_workers",
        title,
        company_name: company_name || (req.user ? req.user.company_name : null),
        contact_name,
        contact_phone,
        whatsapp_phone: whatsapp_phone || contact_phone,
        site_address,
        city,
        state,
        pincode,
        lat,
        lng,
        start_date,
        end_date,
        amenities: amenities || [],
        description,
      };

      const parsedReqs = typeof requirements === "string" ? JSON.parse(requirements) : (requirements || []);

      const postId = await ContractorModel.createPost(postData, parsedReqs);

      return successRes(res, { postId }, "Work site post created successfully", 201);
    } catch (err) {
      console.error("createPost error:", err);
      return errorRes(res, err.message || "Failed to create post", 500);
    }
  },

  // Get Public Feed of Site Posts
  getPublicPosts: async (req, res) => {
    try {
      const { city, role, post_type, search, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const posts = await ContractorModel.getPublicPosts({
        city,
        role,
        post_type,
        search,
        limit: Number(limit),
        offset,
      });

      return successRes(res, { posts }, "Contractor posts fetched successfully");
    } catch (err) {
      console.error("getPublicPosts error:", err);
      return errorRes(res, "Failed to fetch contractor posts", 500);
    }
  },

  // Get Single Post Detail
  getPostById: async (req, res) => {
    try {
      const { id } = req.params;
      const post = await ContractorModel.getPostById(id);

      if (!post) {
        return errorRes(res, "Contractor post not found", 404);
      }

      return successRes(res, { post }, "Post details fetched successfully");
    } catch (err) {
      console.error("getPostById error:", err);
      return errorRes(res, "Failed to fetch post details", 500);
    }
  },

  // Public Contractor Profile
  getPublicProfile: async (req, res) => {
    try {
      const { id } = req.params;
      const contractor = await ContractorModel.getContractorPublicProfile(id);
      if (!contractor) {
        return errorRes(res, "Contractor profile not found", 404);
      }
      return successRes(res, { contractor }, "Contractor public profile fetched successfully");
    } catch (err) {
      console.error("getPublicProfile error:", err);
      return errorRes(res, "Failed to fetch contractor profile", 500);
    }
  },

  // Customer Request Quote / Callback to Contractor
  createQuoteRequest: async (req, res) => {
    try {
      const { contractor_id, customer_name, customer_phone, city, service_type, notes } = req.body;

      if (!contractor_id || !customer_name || !customer_phone || !city) {
        return errorRes(res, "Name, Phone, City, and Contractor are required", 400);
      }

      const quoteId = await ContractorModel.createQuoteRequest({
        contractor_id,
        customer_name,
        customer_phone,
        city,
        service_type: service_type || "General Site Contract",
        notes,
      });

      const contractor = await UserModel.findById(contractor_id);
      const contractorName = contractor?.company_name || contractor?.name || "Contractor";
      const contractorPhone = contractor?.phone || "";

      const whatsappMsg = `Hi ${contractorName}, I submitted a project quote request on QuickSeva (Lead #${quoteId}).\n📋 Service: ${service_type || "General Site Contract"}\n📍 City: ${city}\n👤 Client: ${customer_name} (${customer_phone})\n📝 Details: ${notes || "Looking for site work quote."}\n\nPlease let me know your availability!`;

      // Trigger background automated WhatsApp notification to contractor
      if (contractorPhone) {
        whatsappService.sendWhatsAppNotification(contractorPhone, whatsappMsg).catch((err) => {
          console.warn("⚠️ Non-fatal WhatsApp alert error:", err.message);
        });
      }

      return successRes(
        res,
        {
          quoteId,
          contractor_name: contractorName,
          contractor_phone: contractorPhone,
          whatsapp_msg: whatsappMsg,
        },
        "Quote request registered successfully",
        201
      );
    } catch (err) {
      console.error("createQuoteRequest error:", err);
      return errorRes(res, "Failed to send quote request", 500);
    }
  },

  // Agency / Worker Application to Contractor Post
  createApplication: async (req, res) => {
    try {
      const { post_id, applicant_name, applicant_phone, applicant_type, workers_count, notes } = req.body;

      if (!post_id || !applicant_name || !applicant_phone) {
        return errorRes(res, "Applicant Name, Phone, and Post ID are required", 400);
      }

      const appId = await ContractorModel.createApplication({
        post_id,
        applicant_name,
        applicant_phone,
        applicant_type: applicant_type || "agency",
        workers_count: Number(workers_count) || 1,
        notes,
      });

      return successRes(res, { appId }, "Application sent to contractor successfully", 201);
    } catch (err) {
      console.error("createApplication error:", err);
      return errorRes(res, "Failed to submit application", 500);
    }
  },

  // Get My Posts (Contractor Dashboard)
  getMyPosts: async (req, res) => {
    try {
      const contractorId = req.user.id;
      const userPhone = req.user.phone;
      const posts = await ContractorModel.getPostsByContractor(contractorId, userPhone);
      return successRes(res, { posts }, "Your site posts fetched successfully");
    } catch (err) {
      console.error("getMyPosts error:", err);
      return errorRes(res, "Failed to fetch your posts", 500);
    }
  },

  // Update Contractor Post Details
  updatePost: async (req, res) => {
    try {
      const contractorId = req.user.id;
      const { id } = req.params;
      const updated = await ContractorModel.updatePost(id, contractorId, req.body);
      if (!updated) {
        return errorRes(res, "Post not found or unauthorized", 404);
      }
      return successRes(res, null, "Work site requirement updated successfully");
    } catch (err) {
      console.error("updatePost error:", err);
      return errorRes(res, "Failed to update post", 500);
    }
  },

  // Update Post Status (Active / Closed)
  updatePostStatus: async (req, res) => {
    try {
      const contractorId = req.user.id;
      const { id } = req.params;
      const { status } = req.body;

      if (!["active", "closed"].includes(status)) {
        return errorRes(res, "Invalid status. Must be active or closed", 400);
      }

      const updated = await ContractorModel.updatePostStatus(id, contractorId, status);
      if (!updated) {
        return errorRes(res, "Post not found or unauthorized", 404);
      }

      return successRes(res, null, `Post status updated to ${status}`);
    } catch (err) {
      console.error("updatePostStatus error:", err);
      return errorRes(res, "Failed to update post status", 500);
    }
  },

  // Delete Contractor Post
  deletePost: async (req, res) => {
    try {
      const contractorId = req.user.id;
      const { id } = req.params;

      const deleted = await ContractorModel.deletePost(id, contractorId);
      if (!deleted) {
        return errorRes(res, "Post not found or unauthorized", 404);
      }

      return successRes(res, null, "Work site requirement deleted successfully");
    } catch (err) {
      console.error("deletePost error:", err);
      return errorRes(res, "Failed to delete post", 500);
    }
  },

  // Get Applications for a Contractor Post
  getPostApplications: async (req, res) => {
    try {
      const { id } = req.params;
      const applications = await ContractorModel.getApplicationsForPost(id);
      return successRes(res, { applications }, "Applications fetched successfully");
    } catch (err) {
      console.error("getPostApplications error:", err);
      return errorRes(res, "Failed to fetch applications", 500);
    }
  },

  // Get Customer Quote Requests for Contractor Dashboard
  getQuoteRequests: async (req, res) => {
    try {
      const contractorId = req.user.id;
      const quoteRequests = await ContractorModel.getQuoteRequestsForContractor(contractorId);
      return successRes(res, { quoteRequests }, "Quote requests fetched successfully");
    } catch (err) {
      console.error("getQuoteRequests error:", err);
      return errorRes(res, "Failed to fetch quote requests", 500);
    }
  },

  // Update Quote Lead Status (e.g. pending, contacted, completed, cancelled)
  updateQuoteStatus: async (req, res) => {
    try {
      const contractorId = req.user.id;
      const { id } = req.params;
      const { status } = req.body;

      if (!["pending", "contacted", "completed", "cancelled"].includes(status)) {
        return errorRes(res, "Invalid status type", 400);
      }

      const updated = await ContractorModel.updateQuoteStatus(id, contractorId, status);
      if (!updated) {
        return errorRes(res, "Lead not found or unauthorized", 404);
      }

      return successRes(res, null, `Lead status updated to ${status}`);
    } catch (err) {
      console.error("updateQuoteStatus error:", err);
      return errorRes(res, "Failed to update lead status", 500);
    }
  },

  // Get Contractors Directory for Customers
  getContractorsDirectory: async (req, res) => {
    try {
      const { city, trade, search, page = 1, limit = 100 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const contractors = await ContractorModel.getContractorDirectory({
        city,
        trade,
        search,
        limit: Number(limit),
        offset,
      });

      return successRes(res, { contractors }, "Contractors fetched successfully");
    } catch (err) {
      console.error("getContractorsDirectory error:", err);
      return errorRes(res, "Failed to fetch contractors", 500);
    }
  },

  // Upload Contractor Work Portfolio Images
  uploadWorkImages: async (req, res) => {
    try {
      const contractorId = req.user.id;
      if (!req.files || req.files.length === 0) {
        return errorRes(res, "No work images uploaded", 400);
      }

      const inserted = await ContractorModel.addWorkImages(contractorId, req.files);
      return successRes(res, { work_images: inserted }, "Work images uploaded successfully", 201);
    } catch (err) {
      console.error("uploadWorkImages error:", err);
      return errorRes(res, "Failed to upload work images", 500);
    }
  },

  // Delete Contractor Work Image
  deleteWorkImage: async (req, res) => {
    try {
      const contractorId = req.user.id;
      const { id } = req.params;

      const deleted = await ContractorModel.deleteWorkImage(contractorId, id);
      if (!deleted) {
        return errorRes(res, "Image not found or unauthorized", 404);
      }

      return successRes(res, null, "Work image deleted successfully");
    } catch (err) {
      console.error("deleteWorkImage error:", err);
      return errorRes(res, "Failed to delete work image", 500);
    }
  },

  // Update application status (pending, contacted, hired, rejected)
  updateApplicationStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!["pending", "contacted", "hired", "rejected"].includes(status)) {
        return errorRes(res, "Invalid application status", 400);
      }

      const updated = await ContractorModel.updateApplicationStatus(id, status);
      if (!updated) {
        return errorRes(res, "Application not found", 404);
      }

      return successRes(res, null, `Application status updated to ${status}`);
    } catch (err) {
      console.error("updateApplicationStatus error:", err);
      return errorRes(res, "Failed to update application status", 500);
    }
  },

  // Submit Contractor Verification & Licenses
  submitVerification: async (req, res) => {
    try {
      const contractorId = req.user.id;
      const { gstin, pan_number, license_number } = req.body;
      let verification_doc_url = null;

      const user = await UserModel.findById(contractorId);
      if (!user) {
        return errorRes(res, "Contractor account not found", 404);
      }

      const pan = pan_number ? pan_number.trim().toUpperCase() : null;
      const gst = gstin ? gstin.trim().toUpperCase() : null;
      const lic = license_number ? license_number.trim() : null;

      if (!pan && !gst && !lic) {
        return errorRes(res, "At least PAN Card Number or Labor License Number is required", 400);
      }

      if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
        return errorRes(res, "Invalid PAN Card Number format (e.g. ABCDE1234F)", 400);
      }

      if (gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst)) {
        return errorRes(res, "Invalid GSTIN format (e.g. 24AAAAA0000A1Z5)", 400);
      }

      if (req.file) {
        verification_doc_url = `/uploads/documents/${req.file.filename}`;
      } else if (!user.verification_doc_url) {
        return errorRes(res, "Document proof file upload is required", 400);
      }

      await ContractorModel.submitVerificationDetails(contractorId, {
        gstin: gst,
        pan_number: pan,
        license_number: lic,
        verification_doc_url,
      });

      const updatedUser = await UserModel.findById(contractorId);
      return successRes(res, { user: updatedUser }, "Verification details submitted successfully for admin approval");
    } catch (err) {
      console.error("submitVerification error:", err);
      return errorRes(res, "Failed to submit verification details", 500);
    }
  },

  // Get My Work Images
  getMyWorkImages: async (req, res) => {
    try {
      const contractorId = req.user.id;
      const images = await ContractorModel.getWorkImages(contractorId);
      return successRes(res, { work_images: images }, "Work images fetched successfully");
    } catch (err) {
      console.error("getMyWorkImages error:", err);
      return errorRes(res, "Failed to fetch work images", 500);
    }
  },
};

module.exports = ContractorController;
