import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

// Shows the sign-up form and creates a new patient account
function SignUp() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Creates the Firebase Auth account plus its matching profile document, then logs the user in
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== retypePassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', user.uid), { firstName, lastName, email, role: 'patient' });
      navigate('/home');
    } catch {
      setError('Could not create an account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="signup" className="section-p1">
      <div className="signup-card">
        <h2>Sign Up</h2>

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="signup-row">
            <div className="signup-field">
              <label htmlFor="first-name">First Name</label>
              <input
                id="first-name"
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            <div className="signup-field">
              <label htmlFor="last-name">Last Name</label>
              <input
                id="last-name"
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="signup-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="signup-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="signup-field">
            <label htmlFor="retype-password">Retype Password</label>
            <input
              id="retype-password"
              type="password"
              placeholder="Re-enter your password"
              value={retypePassword}
              onChange={(e) => setRetypePassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="signup-error">{error}</p>}

          <button type="submit" className="normal signup-submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="signup-switch">
          Already have an account?{' '}
          <Link to="/login" className="signup-switch-link">Login</Link>
        </p>
      </div>
    </section>
  );
}

export default SignUp;
