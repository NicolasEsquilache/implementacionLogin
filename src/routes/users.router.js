import { Router } from 'express';
import User from '../dao/models/user.js'
import { createHash, isValidatePassword } from '../pass.js'
const router = Router();

router.post('/register', async (req, res) => {
    const { first_name, last_name, email, age, password } = req.body;
    if (!first_name || !last_name || !email || !age || !password) {
        return res.status(400).send({ status: "error", error: "Faltan datos" });
    }

    try {
        let user = await User.findOne({ email: email });
        if (user) {
            return res.status(400).send({ status: "error", error: "El usuario ya existe" });
        }

        // Definir el rol predeterminado como 'usuario'
        let role = 'usuario';

        // Si el correo electrónico y la contraseña coinciden con el administrador, establecer el rol como 'admin'
        if (email === 'adminCoder@coder.com' && password === 'adminCod3r123') {
            role = 'admin';
        }

        user = new User({
            first_name,
            last_name,
            email,
            age,
            password: createHash(password),
            role: role // Establecer el rol del usuario
        });

        await user.save();

        req.session.user = {
            first_name,
            last_name,
            email,
            age,
            role: role // Agregar el rol del usuario a la sesión
        };

        res.redirect('/login');

    } catch (error) {
        console.error(error);
        res.status(500).send({ status: "error", error: "Error al crear usuario" });
    }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(401).send({ status: "error", error: "Valores incorrectos" });
    }

    try {
        const user = await User.findOne({ email: email }, { email: 1, first_name: 1, last_name: 1, age: 1, password: 1, role: 1 });

        if (!user) {
            return res.status(404).send({ status: "error", error: "Usuario no encontrado" });
        }

        if (!isValidatePassword(user, password)) {
            return res.status(403).send({ status: "error", error: "Contraseña incorrecta" });
        }

        req.session.user = user;

        res.redirect('/profile');

    } catch (error) {
        console.error(error);
        res.status(500).send({ status: "error", error: "Error al iniciar sesión" });
    }
});

//Restore password
router.post('/restore', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send({ status: "error", error: "Correo electrónico y nueva contraseña requeridos" });
    }

    try {
        const updatedUser = await User.findOneAndUpdate(
            { email: email },
            { password: createHash(password) },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).send({ status: "error", error: "Usuario no encontrado" });
        }

        req.session.user = updatedUser;
        res.redirect('/login'); // Redirecciona de nuevo a la página de inicio de sesión
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: "error", error: "Error al actualizar la contraseña" });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.status(500).send('Error al cerrar sesión');
        }
        res.redirect('/login'); // Redirige a la página principal u otra página después de cerrar sesión
    });
});


export default router;
