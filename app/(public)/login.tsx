import { Button, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import React, { useState } from "react";
import Spinner from "react-native-loading-spinner-overlay";
import { Link } from "expo-router";
import { useSignIn } from "@clerk/clerk-expo";

const login = () =>{
    const {signIn, setActive, isLoaded} = useSignIn()
    const [emailAddress, setEmailAddrress] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const onSignInPress = async () => {
        if (!isLoaded) {
          return;
        }
        setLoading(true);
        try {
          const completeSignIn = await signIn.create({
            identifier: emailAddress,
            password,
          });
    
          // This indicates the user is signed in
          await setActive({ session: completeSignIn.createdSessionId });
        } catch (err: any) {
          alert(err.errors[0].message);
        } finally {
          setLoading(false);
        }
    };

    return (
        <View style= {styles.container}>
            <Spinner visible={loading} />
            <TextInput style={styles.inputField} autoCapitalize="none" placeholderTextColor={"gray"} placeholder="syx@xyz.com" value={emailAddress} onChangeText={setEmailAddrress}/>
            <TextInput style={styles.inputField} placeholder="password" placeholderTextColor={"gray"} secureTextEntry={true} onChangeText={setPassword} />

            <Button onPress={onSignInPress} title="login" color={'#6c47ff'} />
    
            <Link href="/reset" asChild>
                <Pressable style={styles.button}>
                    <Text>Forgot password?</Text>
                </Pressable>
            </Link>
            <Link href="/register" asChild>
                <Pressable style={styles.button}>
                    <Text>Create Account</Text>
                </Pressable>
            </Link>
        </View>
    )
}

export default login

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent : 'center',
        padding: 20,
    },
    inputField: {
        marginVertical: 4,
        height: 50,
        borderWidth: 1,
        borderColor: '#6c47ff',
        borderRadius: 4,
        padding: 10,
        backgroundColor: '#fff', 
    },
    button: {
        margin: 8,
        alignItems: 'center'
    }
})