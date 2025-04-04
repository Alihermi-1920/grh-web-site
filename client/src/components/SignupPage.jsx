import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const SignupPage = () => {
  // Ajout du champ "username" dans l'état initial
  const [formData, setFormData] = useState({ name: "", username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/api/auth/signup", formData);
      console.log("Utilisateur inscrit :", response.data);
      navigate("/login");
    } catch (err) {
      console.error("Erreur d'inscription :", err);
      setError(err.response?.data?.message || "Erreur d'inscription. Veuillez réessayer.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h2 className="text-2xl font-bold mb-4">Inscription</h2>
      <form onSubmit={handleSignup} className="bg-white p-6 rounded-lg shadow-md">
        <input
          type="text"
          name="name"
          placeholder="Nom"
          onChange={handleChange}
          className="mb-2 p-2 border"
        />
        <input
          type="text"
          name="username"
          placeholder="Nom d'utilisateur"
          onChange={handleChange}
          className="mb-2 p-2 border"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="mb-2 p-2 border"
        />
        <input
          type="password"
          name="password"
          placeholder="Mot de passe"
          onChange={handleChange}
          className="mb-2 p-2 border"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          S'inscrire
        </button>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default SignupPage;
