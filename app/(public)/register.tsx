import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import React, { useState } from "react";
import { useSignUp } from "@clerk/clerk-expo";
import { Stack } from "expo-router";
import Spinner from "react-native-loading-spinner-overlay";

const register = () =>{
    const {isLoaded, signUp, setActive} = useSignUp();
    const [emailAddress, setEmailAddrress] = useState('')
    const [password, setPassword] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [loading, setLoading] = useState(false)
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState('');

    const onSignUpPress = async () =>{
        if (!isLoaded){
            return
        }
        setLoading(true)

        try {
            await signUp.create({
                emailAddress,
                password,
                firstName,
                lastName
            })

            await signUp.prepareEmailAddressVerification( {strategy: 'email_code'})

            setPendingVerification(true)
        } catch(err: any){
            alert(err)
        } finally{
            setLoading(false)
        }
    }

    const onPressVerify = async () =>{
        if (!isLoaded){
            return
        }

        setLoading(true)

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code
            })

            await setActive({ session: completeSignUp.createdSessionId})
        } catch (err: any){
            alert(err.errors[0].message)
        } finally{
            setLoading(false)
        }
    }
    
    return (
        <View style= {styles.container}>
            <Stack.Screen options={{headerBackVisible: !pendingVerification}} />
            <Spinner visible={loading} />

            {!pendingVerification && (
                <>
                    <TextInput style={styles.inputField} placeholderTextColor={"gray"} autoCapitalize="none" placeholder="First Name" value={firstName} onChangeText={setFirstName}/>
                    <TextInput style={styles.inputField} placeholderTextColor={"gray"} placeholder="Last Name" value={lastName} onChangeText={setLastName} />

                    <TextInput style={styles.inputField} placeholderTextColor={"gray"} autoCapitalize="none" placeholder="syx@xyz.com" value={emailAddress} onChangeText={setEmailAddrress}/>
                    <TextInput style={styles.inputField} placeholderTextColor={"gray"} secureTextEntry={true} placeholder="password" value={password} onChangeText={setPassword} />

                    <Button onPress={onSignUpPress} title="Sign Up" color={'#6c47ff'} />
                </>
            )}

            {pendingVerification && (
                <>
                    <View>
                        <TextInput value={code} placeholderTextColor={"gray"} placeholder="Code" style={styles.inputField} onChangeText={setCode}/>
                    </View>
                    <Button onPress={onPressVerify} title="Verify Email" color={'#6c47ff'} />
                </>
            )}
        </View>
    )
}

export default register;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
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