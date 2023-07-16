import React, { useEffect } from 'react';
import { useState } from 'react';
import {
  StatusBar,
  Text,
  View,
  Button
} from 'react-native';
import { TextInput } from 'react-native';


// Passkit-Generator Packages //
const { PKPass } = require("passkit-generator");
var fs = require('file-system')
var path = require('path')
var axios = require('axios')
const https = require('https');


/////////
// APP //
/////////
function App(): JSX.Element {

let date

  useEffect(() => {
    date = new Date()
  }, [])

  // Pass Details
  const [name, setName] = useState("")
  const [title, setTitle] = useState("")
  const [years, setYears] = useState("")


///////////////
// Functions //
///////////////

  // Sends the POST Request to Firebase Function to create the Apple Pass
  // via HTTP
  function generatePassHttp(){
    // const options = {
    //   hostname: "console.firebase.google.com",
    //   path: "/project/apple-pass-test/overview",
    //   method: "POST",
    //   Headers: {
    //     'Content-Type': 'application/json',
    //     'Content-Length' : data.length
    //   }
    // }

    // Runs HTTP GET Request
  //   https.get( 
  //     // Function Location
  //     "https://console.firebase.google.com/project/apple-pass-test/overview",

  //     // Upon Response do...
  //     (resp) => {
  //       let data = ''

  //       // On Retreiving Data, Add it 
  //       resp.on('data', (chunk) => {
  //         data += chunk
  //       })

  //       // On End
  //       resp.on('end', () => {
  //         console.log(JSON.parse(data).explanation)
  //       })
  //     }
  //   )
  //   // Error Handling
  //   .on("error", )
  }

  // Sends the POST Request to Firebase Function to create the Apple Pass
  // via axios
  async function generatePassAxios(){
    const data = {
      body: {

        // Primary Fields for Pass 
        primary: {
          label: "Name",
          value: name
        },

        // Secondary Fields for PAss
        secondary: [
          {
            label: "Title",
            value: title
          },
          {
            label: "Years in Position",
            value: years
          }
        ],

        // Auxiliary Fields for Pass
        auxiliary: [
          {
            label: "Expires",
            value: "12 - 31 - 30"
          },
          {
            label: "Date Aquired",
            value: `${date.getMonth() + 1} - ${date.getYear()}`
          }
        ],

      }
    }
    try{
      const response = await axios.post("https://console.firebase.google.com/project/apple-pass-test/overview", data)
      console.log(response)
    } catch (err){
      console.error(err)
    }
  }

  function downloadPass(){

  }

//////////
// Main //
//////////
  return (
    <View>
      <StatusBar
        barStyle={'dark-content'}
      />
      <View>
        <Text style={{marginTop: 20, fontSize: 20, fontWeight: 700, textAlign: 'center'}}>
          Enter information to make a pass
        </Text>
      </View>
      <View style={{marginLeft: '20%', marginRight: '20%', marginTop: 35}}>
        <Text style={{marginTop: 10}}>Name</Text>
        <TextInput style={{padding: 5, borderWidth: 1}}
          onChangeText={(content) => setName(content)}
        />
         <Text style={{marginTop: 10}}>Title</Text>
         <TextInput style={{padding: 5, borderWidth: 1}}
          onChangeText={(content) => setTitle(content)}
        />
      </View>
      <View style={{marginTop: 45}}>
        <Button
          title='Add To Wallet'
          onPress={() => generatePassAxios()}
        />
      </View>
    </View>
  );
}


export default App;