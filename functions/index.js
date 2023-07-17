// PKPass is the framework that will allow us to create a Pass in JS
const { PKPass } = require('passkit-generator')

// We are Using Firebase Functions (AWS LAmbda but Firebased) For Deployment
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const { storage } = require('firebase-admin')
// To run this file use `firebase deploy --only functions` in the parent directory

const os = require('os');
var fs = require('file-system')
var path = require('path')
var axios = require('axios')


// Gives Admin Firebase Permissions to the Firebase Storage
admin.initializeApp({
    storageBucket: "apple-pass-test.appspot.com"    // Specifies Program Storage
});

// This Variable will be the Firebase Cloud Storage
const storageRef = admin.storage().bucket()

// Creates a Temporary Diretory to House the pkpass for use
async function generatePKPassPath(){
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, 'model.pkpass');
    return await storageRef.file('model.pkpass').download({ destination: tempFilePath }).then(() => {
        return tempFilePath
    })
}

///////////////////
// MAIN FUNCTION //
///////////////////
exports.pass = functions.https.onRequest((request, response) => {

        // Creates a temporary Directory
        let destination = generatePKPassPath()
       

    // Create a PKPass Object that can be used in JS via Passkit-Generator
    PKPass.from(
    {
        // Path to Pass Directory
        // model: "gs://apple-pass-test.appspot.com/model.pkpass",

        // Using Firebase Storage Objects to pull pkpass
        model: destination,

        // Certificates
        certificates: {                 // Paths to Certificates NEEDS file-system 
            wwdr: fs.readFileSync(path.join(__dirname, 'certs/wwrd.pem')),
            signerCert: fs.readFileSync(path.join(__dirname, 'certs/signerCert.pem')),
            signerKey: fs.readFileSync(path.join(__dirname, 'certs/signerKey.pem')),
            signerKeyPassphrase: "N@l071737"    // This is the password it asks for when generating PEMS
        }
    },

        // this object is the second parameter in the FROM function
        // This holds the information you want to add / overwrite in the pass.json
        {   
            authenticationToken: "29dd6ecd-8486-4641-9d5d-897a50cec8e8",                         // Authentication Token for safe entry and creation
            webServiceURL: "https://us-central1-apple-pass-test.cloudfunctions.net/pass",        // This is the webservice (API / Lambda) address where this program will be located
            serialNumber: "0002A",                                                               // This needs to be unique per pass of the same Identifer
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

        // Saves the BufferData inside the Firebase Storage
        storageRef.file("passes/Generic.pkpass")
            .save(bufferData, (error) => {
                if (!error){
                    fs.writeFileSync("new pkpass", bufferData)
                    response.status(200).send({

                    })
                }
            })
        console.log("Pass Creation Successful!")
    })
    // Error Catching
    .catch(err => {
        console.log("Pass Creation Failed!")
        console.log(err)
        console.error(err)
    })
})