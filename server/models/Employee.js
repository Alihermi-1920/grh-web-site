// models/Employee.js
const mongoose = require("mongoose");
const crypto = require("crypto");

// Vous devez définir une clé secrète de 32 octets (32 caractères en UTF-8)
// Stockez-la idéalement dans une variable d'environnement
const secretKey = process.env.ENCRYPTION_KEY || "vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3";
const algorithm = "aes-256-cbc";

const EmployeeSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // stockera "iv:encrypted"
  phone: String,
  cin: String,
  birthDate: Date, // Date de naissance
  gender: { type: String, enum: ['Homme', 'Femme'] }, // Genre
  department: String,
  role: String,
  position: String,
  hireDate: Date,
  photo: String,
  chefId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },  // Référence au chef (si l'employé est sous sa responsabilité)
  firstLogin: { type: Boolean, default: true } // Flag pour indiquer si c'est la première connexion
});

// Hook pour chiffrer le mot de passe de manière réversible
EmployeeSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();
  try {
    // Génération d'un vecteur d'initialisation (IV)
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
    let encrypted = cipher.update(this.password, "utf8", "hex");
    encrypted += cipher.final("hex");
    // Stocker le résultat sous la forme iv:encryptedPassword
    this.password = iv.toString("hex") + ":" + encrypted;
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour déchiffrer le mot de passe
EmployeeSchema.methods.decryptPassword = function () {
  const [ivHex, encryptedPassword] = this.password.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);
  let decrypted = decipher.update(encryptedPassword, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

// Dans la transformation toJSON, vous pouvez décider d'exposer le mot de passe déchiffré
// UNIQUEMENT pour les administrateurs. Ici, nous l'ajoutons sous la clé "plainPassword".
// En production, il faut s'assurer que cet endpoint soit bien protégé.
EmployeeSchema.set("toJSON", {
  transform: function (doc, ret) {
    // Ne pas exposer le mot de passe chiffré
    delete ret.password;
    // Ajouter le mot de passe en clair (décrypté)
    try {
      ret.plainPassword = doc.decryptPassword();
    } catch (error) {
      ret.plainPassword = "";
    }
    return ret;
  },
});

module.exports = mongoose.model("Employee", EmployeeSchema);
