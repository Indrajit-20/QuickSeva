const ContractorModel = require("../models/contractorModel");
const UserModel = require("../models/userModel");
const { successRes, errorRes } = require("../utils/helpers");

const ContractorController = {
  // Register or Upgrade User to Contractor in Database
  registerContractor: async (req, res) => {
    try {
      const { name, phone, password, company_name, trade_specialization } = req.body;

      if (req.user) {
        // Logged-in user upgrading to contractor
        const userId = req.user.id;
        const targetRole = req.user.role === "seller" || req.user.role === "admin" ? req.user.role : "contractor";
        await UserModel.update(userId, {
          role: targetRole,
          company_name: company_name || req.user.company_name || null,
          trade_specialization: trade_specialization || null,
          is_verified_contractor: 1,
        });

        const updatedUser = await UserModel.findById(userId);
        return successRes(res, "Successfully registered as a Contractor", { user: updatedUser });
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
        });

        const { generateToken } = require("../utils/jwtUtils");
        const token = generateToken({ id: newUserId, role: "contractor" });

        res.cookie("authToken", token, {
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        const newUser = await UserModel.findById(newUserId);
        return successRes(res, "Successfully registered as a Contractor", { user: newUser, token }, 201);
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

      return successRes(res, "Work site post created successfully", { postId }, 201);
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

      return successRes(res, "Contractor posts fetched successfully", { posts });
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

      return successRes(res, "Post details fetched successfully", { post });
    } catch (err) {
      console.error("getPostById error:", err);
      return errorRes(res, "Failed to fetch post details", 500);
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

      return successRes(res, "Callback request sent to contractor successfully", { quoteId }, 201);
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

      return successRes(res, "Application sent to contractor successfully", { appId }, 201);
    } catch (err) {
      console.error("createApplication error:", err);
      return errorRes(res, "Failed to submit application", 500);
    }
  },

  // Get My Posts (Contractor Dashboard)
  getMyPosts: async (req, res) => {
    try {
      const contractorId = req.user.id;
      const posts = await ContractorModel.getPostsByContractor(contractorId);
      return successRes(res, "Your site posts fetched successfully", { posts });
    } catch (err) {
      console.error("getMyPosts error:", err);
      return errorRes(res, "Failed to fetch your posts", 500);
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

      return successRes(res, `Post status updated to ${status}`);
    } catch (err) {
      console.error("updatePostStatus error:", err);
      return errorRes(res, "Failed to update post status", 500);
    }
  },

  // Get Applications for a Contractor Post
  getPostApplications: async (req, res) => {
    try {
      const { id } = req.params;
      const applications = await ContractorModel.getApplicationsForPost(id);
      return successRes(res, "Applications fetched successfully", { applications });
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
      return successRes(res, "Quote requests fetched successfully", { quoteRequests });
    } catch (err) {
      console.error("getQuoteRequests error:", err);
      return errorRes(res, "Failed to fetch quote requests", 500);
    }
  },

  // Get Contractors Directory for Customers
  getContractorsDirectory: async (req, res) => {
    try {
      const { city, trade, search, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const contractors = await ContractorModel.getContractorDirectory({
        city,
        trade,
        search,
        limit: Number(limit),
        offset,
      });

      return successRes(res, "Contractors fetched successfully", { contractors });
    } catch (err) {
      console.error("getContractorsDirectory error:", err);
      return errorRes(res, "Failed to fetch contractors", 500);
    }
  },
};

module.exports = ContractorController;
