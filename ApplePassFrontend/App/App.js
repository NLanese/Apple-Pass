import React, { useEffect } from 'react';
import { useState } from 'react';
import { View, Text, Button } from 'react-native';
import { TextInput } from 'react-native';

// PKPass is the framework that will allow us to create a Pass in JS
const { PKPass } = require('passkit-generator')

// We are Using Firebase Functions (AWS LAmbda but Firebased) For Deployment
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const { storage } = require('firebase-admin')

// file Navigation and Axios
var fs = require('file-system')
var path = require('path')
import axios from "axios";

import BarcodeSecrets from './BarcodeSecrets';



/////////
// APP //
/////////
function App(){



  // Pass Details
  const [name, setName] = useState("")
  const [title, setTitle] = useState("")
  const [years, setYears] = useState("")
  const [date, setDate] = useState()

  // 
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    nDate = new Date()
    setDate(nDate)
  }, [])


///////////////
// Functions //
///////////////

  function handleClick(){
    if (!loading){
      setLoading(true)
      console.log("Generating Pass")
      generatePassAxios()
      .then( pass => {
        console.log("Returning Request")
        if (pass){
          downloadPassFirebase(pass)
        }
        else{
          console.error("Pass And/Or Pass Save has Failed!")
          setLoading(false)
        }
      })
    }
  }

  // Sends the POST Request to Firebase Function to create the Apple Pass
  // via axios
  async function generatePassAxios(){
    const data = {
      // body: {

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

        barcode: BarcodeSecrets(),

      // }
    }
    try{
      const response = await axios.post("https://us-central1-apple-pass-test.cloudfunctions.net/pass", data)
      if (response){
        return response
      }
    } catch (err){
      console.error(err)
    }
  }


  function downloadPassFirebase(pass){
    console.log(pass)
  }

//////////
// Main //
//////////
  return (
    <View style={{marginTop: 40}}>
      <View>
        <Text style={{marginTop: 40, fontSize: 20, fontWeight: 700, textAlign: 'center'}}>
          Enter information to make a pass
        </Text>
      </View>
      <View style={{marginLeft: '20%', marginRight: '20%', marginTop: 45}}>
        <Text style={{marginTop: 10}}>Name</Text>
        <TextInput style={{padding: 5, borderWidth: 1}}
          onChangeText={(content) => setName(content)}
        />
         <Text style={{marginTop: 10}}>Title</Text>
         <TextInput style={{padding: 5, borderWidth: 1}}
          onChangeText={(content) => setTitle(content)}
        />
        <Text style={{marginTop: 10}}>Years</Text>
         <TextInput style={{padding: 5, borderWidth: 1}}
          onChangeText={(content) => setYears(content)}
        />
      </View>
      <View style={{marginTop: 95}}>
        <Button
          title='Add To Wallet'
          onPress={() => handleClick()}
        />
      </View>
    </View>
  );
}


export default App;
