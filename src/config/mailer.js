import nodemailer from 'nodemailer';

const getTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendVerificationEmail = async (to, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

  const mailOptions = {
    from: `"Nova SetUp" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verifica tu cuenta en Nova SetUp',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #3b82f6;">¡Bienvenido a Nova SetUp!</h2>
        <p>Gracias por registrarte. Para poder iniciar sesión y realizar compras, necesitas verificar tu dirección de correo electrónico.</p>
        <p>Por favor haz click en el siguiente botón:</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #3b82f6; text-decoration: none; border-radius: 5px; margin: 20px 0;">Verificar Email</a>
        <p>O copia y pega este enlace en tu navegador:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>Si no creaste esta cuenta, puedes ignorar este correo.</p>
      </div>
    `,
  };

  await getTransporter().sendMail(mailOptions);
};

export const sendRestockEmail = async (toEmails, product) => {
  const productUrl = `${process.env.FRONTEND_URL}/product/${product._id}`;

  const mailOptions = {
    from: `"Nova SetUp" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER, // Email genérico visible en el "To:"
    bcc: toEmails,              // MEJ-08: Usuarios en BCC para no exponer emails entre sí
    subject: `¡Buenas noticias! ${product.name} vuelve a estar en stock`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #10b981;">¡Ha vuelto el stock!</h2>
        <p>Hola,</p>
        <p>Te avisamos que el producto que estabas esperando, <strong>${product.name}</strong>, ya tiene stock nuevamente.</p>
        <img src="${product.images[0]}" alt="${product.name}" style="max-width: 100%; border-radius: 5px; margin: 10px 0;" />
        <p>¡Corre antes de que se vuelva a agotar!</p>
        <a href="${productUrl}" style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #10b981; text-decoration: none; border-radius: 5px; margin: 20px 0;">Ver Producto</a>
      </div>
    `,
  };

  await getTransporter().sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (to, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  const mailOptions = {
    from: `"Nova SetUp" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Recuperación de contraseña en Nova SetUp',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #3b82f6;">Recuperación de contraseña</h2>
        <p>Hemos recibido una solicitud para restablecer tu contraseña en Nova SetUp.</p>
        <p>Por favor haz click en el siguiente botón para crear una nueva contraseña. Este enlace expirará en 15 minutos.</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #3b82f6; text-decoration: none; border-radius: 5px; margin: 20px 0;">Restablecer Contraseña</a>
        <p>O copia y pega este enlace en tu navegador:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Si no solicitaste esto, puedes ignorar este correo de forma segura.</p>
      </div>
    `,
  };

  await getTransporter().sendMail(mailOptions);
};
