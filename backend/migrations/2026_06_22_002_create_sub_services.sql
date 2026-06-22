-- Migration to create sub_services table and seed it
CREATE TABLE IF NOT EXISTS sub_services (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  category_id   INT NOT NULL,
  name          VARCHAR(150) NOT NULL,
  description   TEXT,
  default_price DECIMAL(10,2) DEFAULT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Truncate existing sub_services if any (handles duplicate runs safely)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE sub_services;
SET FOREIGN_KEY_CHECKS = 1;

-- Seed sub-services for all 8 categories
INSERT INTO sub_services (category_id, name, description, default_price) VALUES
  -- Cleaning (category_id = 1)
  (1, 'Deep House Cleaning / पूरे घर की गहरी सफाई', 'Thorough cleaning of all rooms, bathrooms, and kitchen / सभी कमरों, बाथरूम और रसोई की गहरी सफाई', 2999.00),
  (1, 'Bathroom Cleaning / बाथरूम की सफाई', 'Deep stain removal, disinfection, and washing of bathrooms / बाथरूम की गहरी सफाई और कीटाणुशोधन', 499.00),
  (1, 'Kitchen Cleaning / रसोई की सफाई', 'Degreasing of slab, cabinets, and deep cleaning / रसोई के स्लैब, कैबिनेट और टाइल्स की गहरी सफाई', 1199.00),
  (1, 'Sofa & Carpet Cleaning / सोफा और कालीन की सफाई', 'Dry vacuuming and wet shampooing of sofas/carpets / सोफा और कालीन की ड्राई वैक्यूमिंग और शैम्पू धुलाई', 799.00),

  -- Electrical (category_id = 2)
  (2, 'Fan Installation & Repair / पंखा लगाना और सुधारना', 'Installation of ceiling/exhaust fans or repair / पंखा लगाना, मरम्मत या कंडेंसर बदलना', 199.00),
  (2, 'Light Fitting & Repair / लाइट लगाना और सुधारना', 'Fitting bulbs, tubes, fancy lights, or holder repair / नए बल्ब, ट्यूबलाइट लगाना या होल्डर ठीक करना', 149.00),
  (2, 'Switchboard Repair / स्विचबोर्ड की मरम्मत', 'Fixing switches, sockets, regulators, or main board / बटन, सॉकेट, रेगुलेटर या मेन बोर्ड बदलना', 179.00),
  (2, 'House Wiring Inspection / घर की वायरिंग की जांच', 'Detecting short circuits and inspecting complete house wiring / शॉर्ट सर्किट की जांच और वायरिंग मरम्मत', 499.00),

  -- Plumbing (category_id = 3)
  (3, 'Tap Leakage Repair / नल टपकना ठीक करना', 'Fixing water leaks in bathroom, kitchen, or balcony taps / नल या वाल्व से पानी का रिसाव ठीक करना', 149.00),
  (3, 'Washbasin & Sink Repair / वाशबेसिन और सिंक सुधारना', 'Fixing pipe blockages, drain issues, or basin installation / वाशबेसिन, सिंक की पाइप ब्लॉकेज और लीकेज ठीक करना', 249.00),
  (3, 'Toilet & Flush Repair / टॉयलेट और फ्लश सुधारना', 'Fixing flush tank, seat replacement, or leakage / फ्लश टैंक, सीट रिप्लेसमेंट या लीकेज ठीक करना', 299.00),
  (3, 'Water Tank Cleaning / पानी की टंकी की सफाई', 'Scrubbing and chemical disinfection of water storage tanks / पानी के टैंक की पूरी सफाई और कीटाणुशोधन', 999.00),

  -- Carpentry (category_id = 4)
  (4, 'Door Lock & Latch Fitting / ताला और कुंडी लगाना', 'Fitting locks, latches, handles, or eye-pieces / दरवाजे में नया हैंडल, ताला या कुंडी लगाना', 249.00),
  (4, 'Furniture Assembly / फर्नीचर जोड़ना और मरम्मत', 'Assembling beds, tables, wardrobes, or general repair / बेड, मेज, अलमारी फिटिंग या मरम्मत', 599.00),
  (4, 'Drawer & Cabinet Repair / दराज और अलमारी सुधारना', 'Fixing slider channels, hinges, handles / दराज के चैनल, कब्जे या हैंडल ठीक करना', 199.00),
  (4, 'Wooden Polish / लकड़ी की पॉलिश', 'Polishing doors, beds, or tables for new look / दरवाजे या फर्नीचर की वारनिश और पॉलिश', 1499.00),

  -- AC Repair (category_id = 5)
  (5, 'AC Service & Cleaning / एसी सर्विस और धुलाई', 'Deep cleaning filter, coils, and outdoor unit / एसी फिल्टर, कॉइल और आउटडोर यूनिट की पूरी धुलाई', 599.00),
  (5, 'AC Gas Refill / एसी गैस चार्जिंग', 'Detecting leaks and refilling AC cooling gas / गैस लीकेज चेक करना और नई गैस भरना', 2199.00),
  (5, 'AC Installation / एसी फिटिंग', 'Installing split/window AC at your home / स्प्लिट या विंडो एसी लगाना', 1199.00),
  (5, 'AC Not Cooling Repair / एसी कूलिंग ठीक करना', 'Troubleshooting compressor, fan, or sensor problems / एसी कंप्रेसर, कंडेंसर या कूलिंग खराबी ठीक करना', 399.00),

  -- Pest Control (category_id = 6)
  (6, 'General Pest Control / सामान्य कीटनाशक उपचार', 'Spray treatment for ants, spiders, and crawling insects / चींटी, मकड़ी और रेंगने वाले कीड़ों के लिए स्प्रे', 799.00),
  (6, 'Cockroach Control / कॉकरोच नियंत्रण', 'Gel and spray treatment for complete cockroach removal / कॉकरोच भगाने के लिए विशेष जेल और स्प्रे', 899.00),
  (6, 'Bed Bugs Control / खटमल नियंत्रण', 'Two-stage chemical spray treatment for bed bugs / खटमल खत्म करने के लिए दो बार स्प्रे उपचार', 1199.00),
  (6, 'Termite Control / दीमक नियंत्रण', 'Drill and inject chemical treatment for termites / दीमक नियंत्रण के लिए ड्रिल और इंजेक्शन उपचार', 2499.00),

  -- Home Painting (category_id = 7)
  (7, 'One Wall Texture Painting / एक दीवार की टेक्सचर पेंटिंग', 'Adding design or texture to a highlight wall / एक खास दीवार पर सुंदर डिजाइन पेंटिंग', 3499.00),
  (7, 'Complete House Painting / पूरे घर का पेंट', 'Wall putty, primer, and double coat paint / दीवार की पुट्टी, प्राइमर और डबल कोट पुताई', 15000.00),
  (7, 'Wall Waterproofing / दीवार की वॉटरप्रूफिंग', 'Treating wall dampness and water seepage / दीवार की सीलन और रिसाव रोकना', 2499.00),
  (7, 'Door & Window Painting / दरवाजे और खिड़की की पेंटिंग', 'Enamel paint or varnish on doors and windows / लकड़ी/लोहे के दरवाजे-खिड़कियों का पेंट', 699.00),

  -- Appliance Repair (category_id = 8)
  (8, 'Washing Machine Repair / वाशिंग मशीन सुधारना', 'Fixing drum, motor, spin, or drainage errors / वाशिंग मशीन के ड्रम, motor, spin या drainage की मरम्मत', 349.00),
  (8, 'Refrigerator Repair / फ्रिज सुधारना', 'Fixing gas refill, thermostat, or compressor issues / फ्रिज की गैस भरना, थर्मोस्टेट या कंप्रेसर ठीक करना', 399.00),
  (8, 'Geyser Installation & Repair / गीजर लगाना और सुधारना', 'Fixing heating element, thermostat, or installing new geyser / गीजर का एलिमेंट, ऑटो-कट बदलना या नया लगाना', 299.00),
  (8, 'Microwave Oven Repair / माइक्रोवेव ओवन सुधारना', 'Fixing heating, touch panel, or power issues / ओवन की हीटिंग, पैनल या स्विच ठीक करना', 349.00);
