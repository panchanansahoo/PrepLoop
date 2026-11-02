import express from 'express';
import registerRoutes from './register.js';
import loginRoutes from './login.js';
import passwordRoutes from './password.js';
import verificationRoutes from './verification.js';
import sessionRoutes from './session.js';

const router = express.Router();

router.use(registerRoutes);
router.use(loginRoutes);
router.use(passwordRoutes);
router.use(verificationRoutes);
router.use(sessionRoutes);

export default router;

