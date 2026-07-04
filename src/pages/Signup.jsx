import React from 'react'
import Login from './Login'

/**
 * Signup page reuses the same Google Sign-In experience as Login.
 * Keeping a dedicated route avoids breaking existing signup links.
 */
const Signup = () => <Login />

export default Signup


