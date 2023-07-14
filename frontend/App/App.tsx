import React from 'react';
import { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { TextInput } from 'react-native';

// Passkit-Generator Packages //
const { PKPass } = require("passkit-generator");
var fs = require('file-system')
var path = require('path')
var axios = require('axios')


/////////
// APP //
/////////
function App(): JSX.Element {

  // Pass Details
  const [name, setName] = useState("")
  const [title, setTitle] = useState("")





  //////////
  // Main //
  //////////
  return (
    <SafeAreaView>
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
    </SafeAreaView>
  );
}


export default App;
