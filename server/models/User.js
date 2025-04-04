const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  firstName: { 
    type: String, 
    required: [true, "Le prénom est obligatoire"],
    trim: true
  },
  lastName: { 
    type: String, 
    required: [true, "Le nom est obligatoire"],
    trim: true
  },
  email: { 
    type: String, 
    required: [true, "L'email est obligatoire"],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Email invalide"]
  },
  password: { 
    type: String, 
    required: [true, "Le mot de passe est obligatoire"],
    minlength: [6, "Le mot de passe doit contenir au moins 6 caractères"]
  },
  phone: {
    type: String,
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: "Numéro de téléphone invalide"
    }
  },
  department: {
    type: String,
    required: true,
    enum: ["IT", "RH", "Ventes", "Direction", "Marketing"],
    default: "IT"
  },
  role: {
    type: String,
    required: true,
    enum: ["Chef", "Employee", "Admin"],
    default: "Employee"
  },
  position: {
    type: String,
    required: [true, "La position est obligatoire"],
    trim: true
  },
  hireDate: {
    type: Date,
    required: [true, "La date d'embauche est obligatoire"],
    default: Date.now
  },
  photo: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual pour le nom complet
UserSchema.virtual("fullName").get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Hash du mot de passe avant sauvegarde
UserSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Méthode de comparaison de mot de passe
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Méthode de transformation pour le frontend
UserSchema.methods.toProfileJSON = function() {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    fullName: this.fullName,
    email: this.email,
    department: this.department,
    role: this.role,
    position: this.position,
    hireDate: this.hireDate,
    photo: this.photo ? `/uploads/${this.photo.split(/[\\/]/).pop()}` : null,
    phone: this.phone
  };
};

module.exports = mongoose.model("User", UserSchema);