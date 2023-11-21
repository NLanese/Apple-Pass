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
    console.log("REQUEST BODY::: ", request.body, "\n*\n*\n*")
    console.log("Organizer Name: Ostrich Development")
    console.log("REQUEST - Serial Number: ", request.body.serialNumber);
    console.log("REQUEST - Header Body:", request.body.header);
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

        console.log("Empty Pass Initialized...")

        ////////////////////////
        // Pass Customization //
        ////////////////////////

            console.log("Header Object From Request")
            console.log(request.body.header)
            newPass.headerFields.push(
                {
                    label: request.body.header[0].label,      // Finds the primaryFields.label value from the request
                    value: request.body.header[0].value,       // Finds the primaryFields.value value from the request
                    key: request.body.header[0].key
                },
                (request.body.header.length > 1 ? ({
                    label: request.body.header[1].label,      
                    value: request.body.header[1].value, 
                    key: request.body.header[1].key 
                }) : null)
            )

            console.log("Header added...")

            // Adds to Primary Field
            newPass.primaryFields.push(
                {
                    label: request.body.primary[0].label,      // Finds the primaryFields.label value from the request
                    value: request.body.primary[0].value,      // Finds the primaryFields.value value from the request
                    key: request.body.primary[0].key
                },
                (request.body.primary.length > 1 ? ({
                    label: request.body.primary[1].label,      
                    value: request.body.primary[1].value, 
                    key: request.body.primary[1].key
                }) : null)
            )

            console.log("Primary added...")

            // Adds to Secondary Field
            newPass.secondaryFields.push(
                {
                    value: request.body.secondary[0].value,
                    label: request.body.secondary[0].label, 
                    key: request.body.secondary[0].key
                },
                (request.body.secondary.length > 1 ? ({
                    label: request.body.secondary[1].label,      
                    value: request.body.secondary[1].value, 
                    key: request.body.secondary[1].key 
                }) : null)
            )

            console.log("Secondary added...")

            // Adds to Auxiliary Fields
            newPass.auxiliaryFields.push(
                {
                    value: request.body.auxiliary[0].value,
                    label: request.body.auxiliary[0].label, 
                    key: request.body.auxiliary[0].key
                },
                (request.body.header.length > 1 ? ({
                    label: request.body.header[1].label,      
                    value: request.body.header[1].value, 
                    key: request.body.auxiliary[1].key 
                }) : null)
            )

            console.log("Auxiliary added...")

            // Sets Barcodes
            newPass.setBarcodes({
                message: request.body.miscData.barcode,
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

            console.log("Saving the Pass, process starting now...")

            // Creates Buffer version of Pass to be saved
            const bufferData = newPass.getAsBuffer();

            console.log("Pass to Buffer done.")

            // Encode the PKPass data to Base64 to be returned to client
            const base64Data = bufferData.toString("base64");

            console.log("Buffer to base64 done.")

            // Value for the path in Cloud Storage where the PKPass will be saved
            let serialNumber = request.body.serialNumber ? request.body.serialNumber : "00000"
            const saveFilePath = `passes/Tutorial${serialNumber}.pkpass`

            // Accesses or Creates 'passes' directory in Firebase Storage
            // Saves the bufferData to `passes/Tutorial.pkpass`
            storageRef.file(saveFilePath)
            .save(bufferData, (error) => {

                // Save Failed
                if (!error) {
                    console.log("Saved Successfully! \n Save to: ", saveFilePath);
                    console.log("Returning body should include...")
                    console.log(base64Data)
                    // response.status(200).send({ pkpassData: base64Data, saveFilePath: saveFilePath });
                    response.status(200).send({ base64: base64Data });
                } 
                
                // Save Succeeded
                else {
                    console.log("Pass created and fields added, but the final step failed");
                    console.log(error);
                    response.status(500).send({ error: "Failed to save PKPass to Firebase Storage." });
                }
            });

        ////////////////////////
        // RETURNING THE PASS //
        ////////////////////////
    })
    // Error Catching
    .catch(err => {
        console.log("Pass Creation Failed!")
        console.log(err)
        console.error(err)
    })
})