import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  StatusBar,
  Alert,
  Animated,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome, AntDesign } from '@expo/vector-icons';
import { checkEmailExists } from '../../api/services/authService';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState('email'); // 'email' or 'password' or 'register'
  const [isLoading, setIsLoading] = useState(false);
  const { login, register, loading, error, needsOnboarding } = useAuth();
  const navigation = useNavigation();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // For registration
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Input focus state for enhanced UI
  const [focusedInput, setFocusedInput] = useState(null);

  // Check if user needs onboarding after auth state changes
  useEffect(() => {
    if (needsOnboarding) {
      console.log("Onboarding needed - navigating to ProfileOnboarding");
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'ProfileOnboarding' }],
        });
      }, 300);
    }
  }, [needsOnboarding, navigation]);

  useEffect(() => {
    // Run animation when step changes
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();

    return () => {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
    };
  }, [step]);

  // Handle continue after email input - now only for registration
  const handleEmailContinue = async () => {
    if (!email || !validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const exists = await checkEmailExists(email);
      if (exists) {
        // Email exists, but we're trying to register - inform the user
        Alert.alert(
          'Account Exists',
          'An account with this email already exists. Please sign in instead.',
          [
            { text: 'OK', onPress: () => setStep('password') }
          ]
        );
      } else {
        // Email doesn't exist, proceed to registration
        setStep('register');
      }
    } catch (error) {
      console.error('Error checking email:', error);
      Alert.alert('Error', 'Could not verify email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle moving to login screen directly
  const handleGoToLogin = () => {
    if (!email) {
      Alert.alert('Email Required', 'Please enter your email address');
      return;
    }
    
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }
    
    setStep('password');
  };

  // Handle login with email and password
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }
    
    try {
      console.log("Attempting login...");
      const result = await login(email, password);
      console.log("Login successful, checking if onboarding needed:", needsOnboarding);
      // The navigation to onboarding if needed will be handled by the useEffect
    } catch (error) {
      // Error handling is done in the AuthContext
    }
  };

  // Handle registration
  const handleRegister = async () => {
    if (!email || !password || !username || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }
    
    try {
      console.log("Attempting registration...");
      const result = await register(email, password, username);
      console.log("Registration successful, onboarding needed:", needsOnboarding);
      // The navigation to onboarding if needed will be handled by the useEffect
    } catch (error) {
      // Error handling is done in the AuthContext
    }
  };

  // Email validation function
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  // Social login handlers (not implemented yet)
  const handleSocialLogin = (provider) => {
    Alert.alert(
      'Not Implemented',
      `${provider} login is not implemented yet.`,
      [{ text: 'OK' }]
    );
  };

  const renderInputField = (options) => {
    const { value, setValue, placeholder, secureTextEntry, keyboardType, autoCapitalize, isAutoFocus } = options;
    
    return (
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input, 
            focusedInput === placeholder ? styles.inputFocused : null
          ]}
          placeholder={placeholder}
          value={value}
          onChangeText={setValue}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'none'}
          placeholderTextColor="#9CA3AF"
          autoFocus={isAutoFocus}
          onFocus={() => setFocusedInput(placeholder)}
          onBlur={() => setFocusedInput(null)}
        />
        {placeholder.toLowerCase().includes('password') && (
          <TouchableOpacity style={styles.passwordVisibilityButton}>
            <Ionicons name="eye-outline" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
        {placeholder.toLowerCase().includes('email') && value.length > 0 && (
          <TouchableOpacity 
            style={styles.clearTextButton}
            onPress={() => setValue('')}
          >
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/LudeLogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Animated.View 
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.title}>
              {step === 'email' 
                ? 'Login or Create an account' 
                : step === 'password' 
                  ? 'Welcome back' 
                  : 'Join Lude'}
            </Text>
            
            {step === 'email' && (
              <Text style={styles.subtitle}>Enter your email to continue with Lude</Text>
            )}
            
            {step === 'password' && (
              <Text style={styles.subtitle}>Please enter your password to continue</Text>
            )}

            {step === 'register' && (
              <Text style={styles.subtitle}>Complete your profile to get started</Text>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {step === 'email' && (
              <>
                {renderInputField({
                  value: email,
                  setValue: setEmail,
                  placeholder: "Email",
                  keyboardType: "email-address",
                  autoCapitalize: "none",
                  isAutoFocus: true
                })}
                
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleEmailContinue}
                  disabled={isLoading || loading}
                >
                  {isLoading || loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Create Account</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                    </>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleGoToLogin}
                  disabled={isLoading || loading}
                >
                  <Text style={styles.secondaryButtonText}>Sign in</Text>
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>or continue with</Text>
                  <View style={styles.divider} />
                </View>

                <View style={styles.socialButtonsContainer}>
                  <TouchableOpacity
                    style={styles.socialIconButton}
                    onPress={() => handleSocialLogin('Google')}
                  >
                    <AntDesign name="google" size={22} color="#DB4437" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.socialIconButton}
                    onPress={() => handleSocialLogin('Facebook')}
                  >
                    <AntDesign name="facebook-square" size={22} color="#4267B2" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.socialIconButton}
                    onPress={() => handleSocialLogin('Apple')}
                  >
                    <AntDesign name="apple1" size={22} color="#000000" />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {step === 'password' && (
              <>
                <View style={styles.emailDisplayContainer}>
                  <Text style={styles.emailDisplayText}>{email}</Text>
                  <TouchableOpacity onPress={() => setStep('email')}>
                    <Text style={styles.emailChangeText}>Change</Text>
                  </TouchableOpacity>
                </View>
                
                {renderInputField({
                  value: password,
                  setValue: setPassword,
                  placeholder: "Password",
                  secureTextEntry: true,
                  isAutoFocus: true
                })}
                
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Sign in</Text>
                      <Ionicons name="log-in-outline" size={20} color="#fff" style={styles.buttonIcon} />
                    </>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.forgotPasswordButton}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'register' && (
              <>
                <View style={styles.emailDisplayContainer}>
                  <Text style={styles.emailDisplayText}>{email}</Text>
                  <TouchableOpacity onPress={() => setStep('email')}>
                    <Text style={styles.emailChangeText}>Change</Text>
                  </TouchableOpacity>
                </View>
                
                {renderInputField({
                  value: username,
                  setValue: setUsername,
                  placeholder: "Username",
                  isAutoFocus: true
                })}
                
                {renderInputField({
                  value: password,
                  setValue: setPassword,
                  placeholder: "Password",
                  secureTextEntry: true
                })}
                
                {renderInputField({
                  value: confirmPassword,
                  setValue: setConfirmPassword,
                  placeholder: "Confirm Password",
                  secureTextEntry: true
                })}
                
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Create Account</Text>
                      <Ionicons name="person-add-outline" size={20} color="#fff" style={styles.buttonIcon} />
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
          
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By continuing, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 40 : 60,
    marginBottom: 30,
  },
  logo: {
    width: 110,
    height: 110,
  },
  formContainer: {
    paddingHorizontal: 24,
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#111827',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#6B7280',
    lineHeight: 22,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    height: 56,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    fontSize: 16,
    color: '#1F2937',
  },
  inputFocused: {
    borderColor: '#4285F4',
    backgroundColor: '#fff',
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  passwordVisibilityButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 10,
  },
  clearTextButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 10,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#4285F4',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  secondaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#6B7280',
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  socialIconButton: {
    width: 56,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  forgotPasswordButton: {
    alignSelf: 'center',
    marginTop: 16,
    padding: 8,
  },
  forgotPasswordText: {
    color: '#4285F4',
    fontSize: 15,
    fontWeight: '500',
  },
  emailDisplayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emailDisplayText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  emailChangeText: {
    color: '#4285F4',
    fontSize: 14,
    fontWeight: '600',
  },
  termsContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    marginTop: 'auto',
  },
  termsText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  termsLink: {
    color: '#4285F4',
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#B91C1C',
    marginLeft: 6,
    fontSize: 14,
    flex: 1,
  },
});

export default LoginScreen; 