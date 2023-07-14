const { PKPass } = require('passkit-generator')
const functions = require('firebase-functions')
const admin = require('firebase-admin')

var fs = require('file-system')
var path = require('path')
var axios = require('axios')
const { storage } = require('firebase-admin')

// In the Terminal, run `node index.js` to run the program

admin.initializeApp({
    storageBucket: "your-storage-bucket"
});

// This Variable will be the User's Cloud Storage
var storageRef = admin.storage().bucket()

exports.pass = functions.https.onRequest((request, response) => {

    // Create a PKPass Object that can be used in JS via Passkit-Generator
    PKPass.from(
    {
        // Path to Pass Directory
        model: "https://console.firebase.google.com/project/apple-pass-test/overview",   

        // Certificates
        certificates: {                 // Paths to Certificates NEEDS file-system 
            wwdr: fs.fs.readFileSync("./certs/wwrd.pem"),
            signerCert: fs.fs.readFileSync("./certs/signerCert.pem"),
            signerKey: fs.fs.readFileSync("./certs/signerKey.pem"),
            signerKeyPassphrase: "N@l071737"    // This is the password it asks for when generating PEMS
        }
    },

        // this object is the second parameter in the FROM function
        // This holds the information you want to add / overwrite in the pass.json
        {   
            authenticationToken: "123xyz",  // Authentication Token for safe entry and creation
            webServiceURL: "https:",        // This is the webservice (API / Lambda) address where this program will be located
            serialNumber: "0001A",          // This needs to be unique per pass of the same Identifer
            description: "This is a test description!",
            logoText: "Logo Text Here",
        }
    )
    // After Raw Pass Generation
    .then(async (newPass) => {
        
        // Adds to Primary Field
        newPass.primaryFields.push({
            key: "primary",                         // Finds the primaryFields.key value from pass.json
            label: request.body.primary.label,      // Finds the primaryFields.label value from the request from pass.json
            value: request.body.primary.value       // Finds the primaryFields.value value from the request from pass.json
        })

        // Adds to Secondary Field
        newPass.secondaryFields.push(
            {
                key: "secondary0",                      // Finds the secondaryFields[0].key value from pass.json
                label: request.body.secondary[0].label, // Finds the secondaryFields[0].label value from the request from pass.json
                value: request.body.secondary[0].value  // Finds the secondaryFields[0].value value from the request from pass.json
            },
            {
                key: "secondary0",                      // Finds the secondaryFields[1].key value from pass.json
                label: request.body.secondary[1].label, // Finds the secondaryFields[1].label value from the request from pass.json
                value: request.body.secondary[1].value  // Finds the secondaryFields[1].value value from the request from pass.json
            },

        )

        // Adds to Auxiliary Fields
        newPass.auxiliaryFields.push(
            {
                label: request.body.auxiliary[0].label, // Finds the auxiliary[0].label value from the request
                value: request.body.auxiliary[0].value  // Finds the auxiliary[0].value value from the request
            },
            {
                label: request.body.auxiliary[1].label, // Finds the auxiliary[1].label value from the request
                value: request.body.auxiliary[1].value  // Finds the auxiliary[1].value value from the request
            },
        )

        // Sets Barcodes
        newPass.setBarcodes.push({
            
        })

        // If you want to Override the Images saved in the Pass Directory
        // This uses Axios to retrieve any thumbnails sent through the request.
        const imageResponse = await axios.get(request.body.thumbnail, {responseType: 'arraybuffer'})
        const buffer = Buffer.from(imageResponse.data, "utf-8")
        newPass.addBuffer("thumbnail.png", buffer)


        // Creates Buffer version of Pass
        const bufferData = newPass.getAsBuffer()

        // Saves the BufferData inside the User's Apple Storage
        storageRef.file("passes/Coupon.pkpass")
            .save(bufferData, (error) => {
                if (!error){
                    fs.writeFileSync("new pkpass", bufferData)
                    response.status(200).send({

                    })
                }
            })
    })
})