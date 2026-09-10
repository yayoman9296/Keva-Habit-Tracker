import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import BackNavigation from '@/components/BackNavigation';
import { HapticNotify, hapticNotify } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

const AUTH_ERROR_MESSAGE =
  "Couldn't sign you in — wrong password, or no account yet?";

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      hapticNotify(HapticNotify.Error);
      return;
    }

    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (authError) {
      setError(AUTH_ERROR_MESSAGE);
      hapticNotify(HapticNotify.Error);
      return;
    }

    router.replace('/(tabs)');
  }

  return (
    <BackNavigation>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Keva</Text>
        <Text style={styles.tagline}>Build what lasts.</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <View style={styles.form}>
          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            editable={!loading}
          />

          <Text style={[styles.label, styles.labelSpaced]}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
            secureTextEntry
            autoComplete="password"
            editable={!loading}
          />

          {error ? (
            <View style={styles.errorBlock}>
              <Text style={styles.error}>{error}</Text>
              {error === AUTH_ERROR_MESSAGE ? (
                <Link href="/(auth)/signup" style={styles.errorLink}>
                  <Text style={styles.errorLinkText}>Sign up instead</Text>
                </Link>
              ) : null}
            </View>
          ) : null}

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.buttonText}>Sign in</Text>
            )}
          </Pressable>
        </View>

        <Link href="/(auth)/signup" style={styles.link}>
          <Text style={styles.linkText}>Don't have an account? Sign up</Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
    </BackNavigation>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 40,
    fontWeight: '700',
    textAlign: 'center',
  },
  tagline: {
    color: colors.accent,
    fontFamily: fonts.label,
    fontSize: 13,
    letterSpacing: 1.5,
    marginTop: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    marginTop: 48,
  },
  label: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  labelSpaced: {
    marginTop: 20,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  errorBlock: {
    marginTop: 16,
  },
  error: {
    color: colors.accent2,
    fontFamily: fonts.label,
    fontSize: 13,
    textAlign: 'center',
  },
  errorLink: {
    marginTop: 8,
  },
  errorLinkText: {
    color: colors.accent,
    fontFamily: fonts.label,
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    marginTop: 28,
    paddingVertical: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    marginTop: 24,
  },
  linkText: {
    color: colors.accent,
    fontFamily: fonts.label,
    fontSize: 14,
    textAlign: 'center',
  },
});