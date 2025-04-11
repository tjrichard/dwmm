import { supabase } from "./supabase";

/**
 * Ensures the user is authenticated, either by existing session or anonymous sign-in
 * @returns {Promise<string|null>} The user ID if authentication is successful
 */
export const ensureAuthenticated = async () => {
  try {
    // Check if user is already signed in
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      return user.id;
    }

    // Sign in anonymously if no user exists
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error("Error signing in anonymously:", error);
      return null;
    }

    return data.user.id;
  } catch (err) {
    console.error("Exception during authentication:", err);
    return null;
  }
};

/**
 * Converts an anonymous user to a permanent user with email and password
 * @param {string} email - The user's email address
 * @param {string} password - The user's chosen password
 * @returns {Promise<{success: boolean, error: any}>} Result of the operation
 */
export const convertAnonymousUser = async (email, password) => {
  try {
    // First update with email to trigger verification
    const { error: emailError } = await supabase.auth.updateUser({ email });

    if (emailError) {
      return { success: false, error: emailError };
    }

    return {
      success: true,
      message:
        "Verification email sent. Please verify your email before setting a password.",
    };
  } catch (err) {
    console.error("Exception during user conversion:", err);
    return { success: false, error: err };
  }
};

/**
 * Sets a password for a user after email verification
 * @param {string} password - The user's chosen password
 * @returns {Promise<{success: boolean, error: any}>} Result of the operation
 */
export const setPasswordAfterVerification = async (password) => {
  try {
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error("Exception during password update:", err);
    return { success: false, error: err };
  }
};

/**
 * Signs out the current user
 * @returns {Promise<{success: boolean, error: any}>} Result of the operation
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error("Exception during sign out:", err);
    return { success: false, error: err };
  }
};

/**
 * Gets the current user if authenticated
 * @returns {Promise<{user: object|null, error: any}>} The current user or null
 */
export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return { user: null, error };
    }

    return { user: data.user, error: null };
  } catch (err) {
    console.error("Exception getting current user:", err);
    return { user: null, error: err };
  }
};

/**
 * Checks if the current user is anonymous or verified
 * Logs the user status
 * @returns {Promise<void>}
 */
export const checkUserStatus = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('Error fetching user:', error)
      return
    }

    if (user) {
      console.log('Authenticated User ID:', user.id)
      console.log('User Email:', user.email || 'Anonymous User')
    } else {
      console.log('No user is currently signed in')
    }
  } catch (err) {
    console.error('Exception checking user status:', err)
  }
}
