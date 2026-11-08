import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { compressImage, ensureDecodable } from '../utils/image.js'

const conditions = ['Refurbished', 'Acceptable', 'Good', 'Very Good', 'Excellent'];

// Makes up a short, readable id for a new trade-in, e.g. TI-ABC123-XYZ
function generateTradeInId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `TI-${timestamp}-${random}`;
}

// Shows the form a donor fills in to submit a hearing aid for trade-in
function TradeIn() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [donorName, setDonorName] = useState('');

  const [deviceModel, setDeviceModel] = useState('');
  const [condition, setCondition] = useState('');
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tradeInId, setTradeInId] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);

      if (currentUser) {
        const snapshot = await getDoc(doc(db, 'users', currentUser.uid));
        if (snapshot.exists()) {
          const { firstName, lastName } = snapshot.data();
          setDonorName(`${firstName} ${lastName}`.trim());
        }
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    return () => {
      photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    };
  }, [photos]);

  // Converts any HEIC photos to JPEG and builds the preview thumbnails
  const handlePhotosChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setError('');
    const prepared = [];
    for (const file of files) {
      try {
        const decodable = await ensureDecodable(file);
        prepared.push({ file: decodable, url: URL.createObjectURL(decodable) });
      } catch (err) {
        setError(err.message);
      }
    }

    setPhotos((current) => {
      current.forEach((photo) => URL.revokeObjectURL(photo.url));
      return prepared;
    });
  };

  // Removes one selected photo before the form is submitted
  const removePhoto = (index) => {
    setPhotos((current) => {
      const next = [...current];
      const [removed] = next.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.url);
      return next;
    });
  };

  // Compresses the photos and saves the trade-in request to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const photoData = await Promise.all(
        photos.map((photo) => compressImage(photo.file))
      );

      const id = generateTradeInId();
      await setDoc(doc(db, 'tradeIns', id), {
        donorId: user.uid,
        donorName,
        donorEmail: user.email,
        deviceModel,
        condition,
        photos: photoData,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      setTradeInId(id);
    } catch {
      setError('Could not submit your trade-in request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!authChecked) {
    return (
      <section id="trade-in" className="section-p1">
        <p>Loading...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section id="trade-in" className="section-p1">
        <p>You need to log in to submit a trade-in request.</p>
        <Link to="/login" className="normal">Log In</Link>
      </section>
    );
  }

  if (tradeInId) {
    return (
      <section id="trade-in" className="section-p1">
        <div className="trade-in-success">
          <i className="fa-solid fa-circle-check"></i>
          <h2>Trade-in request submitted!</h2>
          <p>We'll review your {deviceModel || 'device'} and get back to you with an offer soon.</p>
          <p className="trade-in-id">Your Trade-in ID: <strong>{tradeInId}</strong></p>
          <p>Share this ID with a partnered clinic to have your device reviewed.</p>
          <Link to="/home"><button className="normal">Back to Home</button></Link>
        </div>
      </section>
    );
  }

  return (
    <section id="trade-in" className="section-p1">
      <h2>Trade-In Your Hearing Aids</h2>
      <p>Tell us about your device and we'll get you a trade-in quote.</p>

      <form className="trade-in-form" onSubmit={handleSubmit}>
        <div className="trade-in-field">
          <label htmlFor="device-model">Device Model</label>
          <input
            id="device-model"
            type="text"
            placeholder="e.g. Audéo Paradise P90"
            value={deviceModel}
            onChange={(e) => setDeviceModel(e.target.value)}
            required
          />
        </div>

        <div className="trade-in-field">
          <label htmlFor="condition">Condition</label>
          <select
            id="condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            required
          >
            <option value="" disabled>Select condition</option>
            {conditions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="trade-in-field">
          <span className="trade-in-label">Photos</span>
          <label htmlFor="photos" className="trade-in-upload">
            <i className="fa-solid fa-camera"></i> Upload photos of your device
          </label>
          <input
            id="photos"
            className="trade-in-file-input"
            type="file"
            accept="image/*,.heic,.heif"
            multiple
            onChange={handlePhotosChange}
          />

          {photos.length > 0 && (
            <div className="trade-in-previews">
              {photos.map((photo, i) => (
                <div className="trade-in-preview" key={photo.url}>
                  <img src={photo.url} alt={`Device photo ${i + 1}`} />
                  <button type="button" onClick={() => removePhoto(i)} aria-label="Remove photo">
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="trade-in-error">{error}</p>}

        <button type="submit" className="normal trade-in-submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Trade-In Request'}
        </button>
      </form>
    </section>
  );
}

export default TradeIn;
