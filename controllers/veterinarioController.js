import Veterinario from "../models/Veterinario.js";
import generarJWT from "../helpers/generarJWT.js";
import generarId from "../helpers/generarId.js";
import emailRegistro from "../helpers/emailRegistro.js";
import emailOlvidePassword from "../helpers/emailOlvidePassword.js";

const registrar = async (req, res) => {
  const { email, nombre } = req.body;

  //prevenir usuarios duplicados
  const existeUsuario = await Veterinario.findOne({
    email,
  });

  if (existeUsuario) {
    // console.log("existen usuario");
    const error = new Error("Usuario ya registrado");
    return res.status(400).json({ msg: error.message });
  }

  try {
    //guardar nuevo veterinario
    const veterinario = new Veterinario(req.body);
    const veterinarioGuardado = await veterinario.save();

    //enviar el email
    emailRegistro({
      email,
      nombre,
      token: veterinarioGuardado.token,
    });

    res.json(veterinarioGuardado);
  } catch (error) {
    console.log(`Error: ${error.message}`);
    res.json();
  }
};

const perfil = (req, res) => {
  // console.log(req.veterinario);
  const { veterinario } = req;
  res.json(veterinario);
};

const confirmar = async (req, res) => {
  // console.log(req.params.token);
  const { token } = req.params;

  const usuarioConfirmar = await Veterinario.findOne({ token });

  console.log(usuarioConfirmar);
  if (!usuarioConfirmar) {
    const error = new Error("Token no valido");
    return res.status(404).json({ msg: error.message });
  }

  try {
    usuarioConfirmar.token = null;
    usuarioConfirmar.confirmado = true;
    await usuarioConfirmar.save();
    res.json({ msg: "Usuarios confirmado correctamente" });
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
};

const autenticar = async (req, res) => {
  // console.log(req.body);
  const { email, password } = req.body;
  //comprobar si el usuario existe
  const usuario = await Veterinario.findOne({ email });
  if (!usuario) {
    const error = new Error("El usuario no existe");
    return res.status(403).json({ msg: error.message });
  }

  //comprobar si el usuario esta confirmado
  if (!usuario.confirmado) {
    const error = new Error("Tu cuenta no ha sido confirmada");
    return res.status(403).json({ msg: error.message });
  }
  //revisar el password
  if (await usuario.comprobarPassword(password)) {
    // console.log("password correcto");
    //autenticar
    console.log(usuario);
    usuario.token = generarJWT(usuario.id);
    res.json({
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      token: usuario.token,
    });
  } else {
    const error = new Error("El password es incorrecto");
    return res.status(403).json({ msg: error.message });
  }

  //autenticar al usuario
};

const olvidePassword = async (req, res) => {
  const { email } = req.body;
  // console.log(email);
  const existeVeterinario = await Veterinario.findOne({ email });
  console.log(existeVeterinario);
  if (!existeVeterinario) {
    const error = new Error("El usuario no existe");
    return res.status(400).json({ msg: error.message });
  }
  try {
    existeVeterinario.token = generarId();
    await existeVeterinario.save();

    emailOlvidePassword({
      email,
      nombre: existeVeterinario.nombre,
      token: existeVeterinario.token,
    });

    return res.json({ msg: "Hemos enviado un mensaje con las instrucciones" });
  } catch (error) {
    console.log(error);
  }
};

const comprobarToken = async (req, res) => {
  const { token } = req.params;
  console.log(token);
  const tokenValido = await Veterinario.findOne({ token });
  if (tokenValido) {
    //el token es valid el usuario existe
    return res.json({ msg: "Token valido y el usuario existe" });
  } else {
    const error = new Error("Token no valido");
    return res.status(400).json({ msg: error.message });
  }
};

const nuevoPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const veterinario = await Veterinario.findOne({ token });
  if (!veterinario) {
    const error = new Error("Hubo un error");
    return res.status(400).json({ msg: error.message });
  }

  try {
    veterinario.token = null;
    veterinario.password = password;
    await veterinario.save();
    // console.log(veterinario);
    return res.json({ msg: "Password modificado correctamente" });
  } catch (error) {
    console.log(error);
  }
};

const actualizarPerfil = async (req, res) => {
  // console.log(req.params.id);
  // console.log(req.body);
  const veterinario = await Veterinario.findById(req.params.id);

  if (!veterinario) {
    const error = new Error("Hubo un error");
    return res.status(400).json({ msg: error.message });
  }
  const { email } = req.body;
  if (veterinario.email !== req.body.email) {
    const existeEmail = await Veterinario.findOne({ email });
    if (existeEmail) {
      const error = new Error("Ese email ya esta en uso");
      return res.status(400).json({ msg: error.message });
    }
  }

  try {
    veterinario.nombre = req.body.nombre || veterinario.nombre;
    veterinario.email = req.body.email || veterinario.email;
    veterinario.web = req.body.web || veterinario.web;
    veterinario.telefono = req.body.telefono || veterinario.telefono;
    const veterinarioActualizado = await veterinario.save();
    return res.json(veterinarioActualizado);
  } catch (error) {
    console.log(error);
  }
};

const actualizarPassword = async (req, res) => {
  // console.log('nos comunicamos');
  // console.log(req.veterinario);
  // console.log(req.body);
  const { id } = req.veterinario;
  const { pwd_actual, pwd_nuevo } = req.body;

  const veterinario = await Veterinario.findById(id);

  if (!veterinario) {
    const error = new Error("Hubo un error");
    return res.status(400).json({ msg: error.message });
  }

  if (await veterinario.comprobarPassword(pwd_actual)) {
    veterinario.password = pwd_nuevo;
    await veterinario.save();
    return res.json({ msg: "Password almacenado correctamente" });
  } else {
    const error = new Error("El password actual es incorrecto");
    return res.status(400).json({ msg: error.message });
  }
};
export {
  registrar,
  perfil,
  confirmar,
  autenticar,
  olvidePassword,
  comprobarToken,
  nuevoPassword,
  actualizarPerfil,
  actualizarPassword,
};
