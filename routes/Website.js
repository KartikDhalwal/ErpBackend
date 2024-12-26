const { dbname } = require("../utils/dbconfig");
const jwt = require("jsonwebtoken");
const FormData = require("form-data");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const { lutimes } = require("fs");

async function uploadImage2(files, Comp_Code, Created_by) {
  try {
    let dataArray = [];
    // console.log(files);
    await Promise.all(
      files?.map(async (file, index) => {
        const customPath = `${Comp_Code}/Website/`;
        const ext = path.extname(file.originalname);
        // Generate randomUUID
        const randomUUID = uuidv4();
        // Append extension to randomUUID
        const fileName = randomUUID + ext;
        const formData = new FormData();
        formData.append("photo", file.buffer, fileName);
        formData.append("customPath", customPath);
        try {
          const response = await axios.post(
            "http://cloud.autovyn.com:3000/upload-photo",
            formData,
            {
              headers: formData.getHeaders(),
            }
          );
          const data = {
            SRNO: index,
            User_Name: Created_by,
            DOC_NAME: file.originalname,
            fieldname: file.fieldname,
            path: `${customPath}${fileName}`,
          };
          // console.log(data, 'data');
          dataArray.push(data);
          console.log(`Image uploaded successfully`);
        } catch (error) {
          console.log(error);
          console.error(`Error uploading image ${index}:, error.message`);
        }
        // Doc_Type	TRAN_ID	SRNO	path	File_Name	User_Name	Upload_Date	Export_type
      })
    );
    return dataArray;
  } catch (e) {
    console.log(e);
  }
}

exports.uploadedResume = async function (req, res) {
  console.log(req.files, "files");
  try {
    const sequelize = await dbname(req.headers.compcode);
    const UTD = req.body.UTD;
    try {
      if (req.files) {
        const EMP_DOCS_data = await uploadImage2(
          req.files,
          req.headers.compcode.split("-")[0],
          req.body.name
        );
        console.log(EMP_DOCS_data, "EMP_DOCS_data");
        res.status(200).send(EMP_DOCS_data[0].path);
      } else {
        res.status(200).send("No File Uploaded");
      }
    } catch (e) {
      console.log(e);
    }
  } catch (e) {
    console.log(e);
  }
};

exports.uploadTestimonialImage = async function (req, res) {
  console.log(req.files, "files");
  try {
    const sequelize = await dbname(req.headers.compcode);
    const UTD = req.body.UTD;
    try {
      if (req.files) {
        const EMP_DOCS_data = await uploadImage2(
          req.files,
          req.headers.compcode.split("-")[0],
          req.body.name
        );
        console.log(EMP_DOCS_data, "EMP_DOCS_data");
        res.status(200).send(EMP_DOCS_data[0].path);
      } else {
        res.status(200).send("No File Uploaded");
      }
    } catch (e) {
      console.log(e);
    }
  } catch (e) {
    console.log(e);
  }
};

exports.UpdateTestimonial = async function (req, res) {
  console.log(req.body, 'req.bodyreq.body')
  try {
    const UTD = req.body.UTD;
    const response = req.body.response;
    const sequelize = await dbname(req.body.compcode);

    // Update query to set the customer status only if Cust_Status is null
    const query = `UPDATE Testimonials SET Active = '1' WHERE UTD = '${UTD}'`;
    await sequelize.query(query);

    res.status(200).send({
      success: true,
      message: `Customer response '${response}' saved successfully.`,
    });
  } catch (e) {
    console.log(e);
    res.status(500).send({ success: false, message: "Error updating customer response." });
  }
};



exports.TestimonialMsg = async function (req, res) {
  try {
    console.log(req.query, 'req.query');
    const compcode = req.query.compcode; // Base64 decode
    const UTD = req.query.UTD;

    const sequelize = await dbname(compcode);

    // Query for the asset details
    const results = await sequelize.query(
      `SELECT Name, Email, Testimonial, Rating, Image, Company FROM Testimonials WHERE UTD = '${UTD}';`
    );

    console.log(results, 'results');

    const userDetails = results[0][0]; // Extract the first user's details

    // Function to generate star icons based on the rating
    const generateStars = (rating) => {
      let stars = '';
      const fullStars = Math.floor(rating); // Full stars count
      const halfStar = rating % 1 >= 0.5 ? 1 : 0; // Half star if rating is 0.5 or more
      const emptyStars = 5 - fullStars - halfStar; // Remaining stars are empty

      // Add full stars
      for (let i = 0; i < fullStars; i++) {
        stars += '<span class="star filled">&#9733;</span>';
      }

      // Add half star if applicable
      if (halfStar) {
        stars += '<span class="star half-filled">&#9733;</span>';
      }

      // Add empty stars
      for (let i = 0; i < emptyStars; i++) {
        stars += '<span class="star empty">&#9733;</span>';
      }

      return stars;
    };

    const htmlResponse = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>User Details Form</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f9f9f9;
          color: #333;
          margin: 0;
          padding: 20px;
        }
        h1 {
          text-align: center;
        }
        .container {
          max-width: 500px;
          margin: 0 auto;
          background-color: white;
          padding: 20px;
          border-radius: 5px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .form-group {
          margin-bottom: 15px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-sizing: border-box;
        }
        .form-group img {
          display: block;
          margin: 20px auto;
          max-width: 100%;
          height: 200px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .rating {
          font-size: 24px;
          color: #ffcc00;
        }
        .rating .star {
          font-size: 30px;
        }
        .rating .filled {
          color: gold;
        }
        .rating .half-filled {
          color: gold;
          position: relative;
        }
        .rating .half-filled::after {
          content: '★';
          color: #ccc;
          position: absolute;
          left: 0;
          width: 50%;
          overflow: hidden;
        }
        .rating .empty {
          color: #ccc;
        }
        .button-container {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 20px;
        }
        .button {
          background-color: #004080;
          color: white;
          border: none;
          padding: 10px 20px;
          cursor: pointer;
          text-decoration: none;
          border-radius: 5px;
        }
        .button:hover {
          background-color: #003366;
        }
        #message {
          display: none;
          margin-top: 20px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Testimonial Details</h1>
        <form>
          <div class="form-group">
            <label for="name">Name</label>
            <input type="text" id="name" value="${userDetails.Name}" readonly />
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" value="${userDetails.Email || ''}" readonly />
          </div>
          <div class="form-group">
            <label for="Company">Company</label>
            <input type="Company" id="Company" value="${userDetails.Company || ''}" readonly />
          </div>
          <div class="form-group">
            <label for="testimonial">Testimonial</label>
            <input type="text" id="testimonial" value="${userDetails.Testimonial}" readonly />
          </div>
          <div class="form-group">
            <label for="rating">Rating</label>
            <div class="rating">
              ${generateStars(userDetails.Rating)}
            </div>
          </div>
          <div class="form-group">
            <img src="https://erp.autovyn.com/backend/fetch?filePath=${userDetails.Image}" alt="User Image" />
          </div>
          <div class="button-container">
            <button class="button" type="button" onclick="handleApproval('1', '${UTD}', 'AVYN')">Yes</button>
            <button class="button" type="button">No</button>
          </div>
        </form>
    
        <!-- Add a message container here -->
        <div id="message" style="display:none;"></div>
      </div>
    
      <script>
        function generateStars(rating) {
          let stars = '';
          const fullStars = Math.floor(rating); // Full stars count
          const halfStar = rating % 1 >= 0.5 ? 1 : 0; // Half star if rating is 0.5 or more
          const emptyStars = 5 - fullStars - halfStar; // Remaining stars are empty
    
          // Add full stars
          for (let i = 0; i < fullStars; i++) {
            stars += '<span class="star filled">&#9733;</span>';
          }
    
          // Add half star if applicable
          if (halfStar) {
            stars += '<span class="star half-filled">&#9733;</span>';
          }
    
          // Add empty stars
          for (let i = 0; i < emptyStars; i++) {
            stars += '<span class="star empty">&#9733;</span>';
          }
    
          return stars;
        }
    
        function handleApproval(response, utd, compcode) {
          fetch('https://erp.autovyn.com/backend/Website/UpdateTestimonial', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'compcode': compcode
            },
            body: JSON.stringify({ UTD: utd, response: response, compcode: compcode })
          })
          .then(res => res.json())
          .then(data => {
            showMessage('Successfully');
          })
          .catch(err => {
            console.error('Error:', err);
            showMessage('An error occurred while submitting your response. Please try again.', true);
          });
        }
    
        function showMessage(message, isError = false) {
          const messageElement = document.getElementById('message');
          messageElement.textContent = message;
          messageElement.style.color = isError ? 'red' : 'green';
          messageElement.style.display = 'block'; // Make the message visible
        }
      </script>
    </body>
    </html>
    
    `;

    res.send(htmlResponse);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while fetching employee asset data');
  }
};

