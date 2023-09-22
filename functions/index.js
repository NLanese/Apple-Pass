// To deploy this function use `firebase deploy --only functions` in the root directory


// PKPass is the framework that will allow us to create a Pass in JS
const { PKPass } = require('passkit-generator')

// We are Using Firebase Functions (AWS LAmbda but Firebased) For Deployment
const functions = require('firebase-functions')
const admin = require('firebase-admin')

var fs = require('file-system')
var path = require('path')
var axios = require('axios')


// Gives Admin Firebase Permissions to the Firebase Storage
admin.initializeApp({
    storageBucket: "apple-pass-test.appspot.com"    // Sets the specific firebase storage buck ID
});

// This Variable will be the Firebase Cloud Storage
const storageRef = admin.storage().bucket()


// Grabs all PEM Certificates
function getCertificates(){
    const wwdr = fs.readFileSync(path.join(__dirname, 'certs', 'wwdr.pem'));
    const signerCert = fs.readFileSync(path.join(__dirname, 'certs', 'sign\erCert.pem'));
    const signerKey = fs.readFileSync(path.join(__dirname, 'certs', 'signerKey.pem'));

    return { wwdr, signerCert, signerKey };
}

const {wwdr, signerCert, signerKey} = getCertificates()

///////////////////
// MAIN FUNCTION //
///////////////////
exports.pass = functions.https.onRequest( async(request, response) => {


    console.log("============================")
    console.log("Organizer Name: Ostrich Development")
    console.log("REQUEST - Serial Number: ", request.body.serialNumber);
    console.log("REQUEST - Primary Body:", request.body.primary);
    console.log("REQUEST - Secondary Body:", request.body.secondary);
    console.log("REQUEST - Auxiliary Body:", request.body.secondary);
    

    console.log("============================")

    // Create a PKPass Object that can be used in JS via Passkit-Generator
    const newPass = PKPass.from(
    {
        model: "./model.pass",

        // Certificates
        certificates: {                 // Paths to Certificates NEEDS file-system 
            wwdr: wwdr,
            signerCert: signerCert,
            signerKey: signerKey,
            signerKeyPassphrase: "N@l071737"
        }
    },

        // this object is the second parameter in the FROM function
        // This holds the information you want to add / overwrite in the pass.json
        {   
            authenticationToken: "29dd6ecd-8486-4641-9d5d-897a50cec8e8",                         // Authentication Token for safe entry and creation
            webServiceURL: "https://us-central1-apple-pass-test.cloudfunctions.net/pass",        // This is the webservice (API / Lambda) address where this program will be located
            serialNumber: request.body.serialNumber ? request.body.serialNumber : "00000",                                                          // This needs to be unique per pass of the same Identifer
            description: "This is a test description!",
            logoText: "Logo Text Here",
            organizationName: "Ostrich Development"
        }
    )
    // After Raw Pass Generation
    .then(async (newPass) => {

        ////////////////////////
        // Pass Customization //
        ////////////////////////


            // Adds to Primary Field
            newPass.primaryFields.push({
                key: "primary",                         
                label: request.body.primary.label,      // Finds the primaryFields.label value from the request
                value: request.body.primary.value       // Finds the primaryFields.value value from the request
            })

            // Adds to Secondary Field
            newPass.secondaryFields.push(
                {value: request.body.secondary[0].value},
                {value: request.body.secondary[1].value},
            )

            // Adds to Auxiliary Fields
            newPass.auxiliaryFields.push(
                {value: request.body.auxiliary[0].value},
                {value: request.body.auxiliary[1].value},
            )

            // Sets Barcodes
            newPass.setBarcodes({
                message: request.body.barcode,
                format: "PKBarcodeFormatQR",
                altText: "11424771526"
            })

        // If you want to Override the Images saved in the Pass Directory
        // This uses Axios to retrieve any thumbnails sent through the request.
        // const imageResponse = await axios.get(request.body.thumbnail, {responseType: 'arraybuffer'})
        // const buffer = Buffer.from(imageResponse.data, "utf-8")
        // newPass.addBuffer("thumbnail.png", buffer)

        /////////////////////
        // Saving the Pass //
        /////////////////////

            // Creates Buffer version of Pass to be saved
            const bufferData = newPass.getAsBuffer();

            // Encode the PKPass data to Base64 to be returned to client
            const base64Data = bufferData.toString("base64");

            // Value for the path in Cloud Storage where the PKPass will be saved
            const saveFilePath = `passes/Tutorial_${serialNumber}.pkpass`

            // Accesses or Creates 'passes' directory in Firebase Storage
            // Saves the bufferData to `passes/Tutorial.pkpass`
            storageRef.file(saveFilePath)
            .save(bufferData, (error) => {

                // Save Failed
                if (!error) {
                    console.log("Saved Successfully! \n Save to: ", saveFilePath);
                    response.status(200).send({ pkpassData: base64Data, saveFilePath: saveFilePath });
                } 
                
                // Save Succeeded
                else {
                    console.log("Pass created and fields added, but the final step failed");
                    console.log(error);
                    response.status(500).send({ error: "Failed to save PKPass to Firebase Storage." });
                }
            });
    })
    // Error Catching
    .catch(err => {
        console.log("Pass Creation Failed!")
        console.log(err)
        console.error(err)
    })
})