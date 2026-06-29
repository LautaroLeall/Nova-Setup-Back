import axios from 'axios';

const sendEmailJSRest = async (to, subject, htmlContent) => {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_BACKEND;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    console.error("Faltan variables de entorno para EmailJS en el backend.");
    return;
  }

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    accessToken: privateKey,
    template_params: {
      to_email: to,
      subject: subject,
      html_message: htmlContent
    }
  };

  try {
    await axios.post('https://api.emailjs.com/api/v1.0/email/send', payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log(`Email enviado con éxito a ${to}`);
  } catch (error) {
    console.error("Error enviando correo con EmailJS:", error.response?.data || error.message);
    throw new Error("Fallo al enviar correo");
  }
};

export const sendVerificationEmail = async (to, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  const subject = 'Verifica tu cuenta en Nova SetUp';
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #0b0f19; color: #f8fafc; border-radius: 12px; text-align: center; border: 1px solid #1e293b;">
      <img src="https://nova-setup.vercel.app/logo-NovaSetUp.png" alt="Nova SetUp" style="max-width: 150px; margin-bottom: 20px;" />
      <h2 style="color: #3b82f6; font-size: 24px; margin-bottom: 10px;">¡Bienvenido a Nova SetUp!</h2>
      <p style="font-size: 16px; color: #cbd5e1; line-height: 1.5; margin-bottom: 20px;">
        Gracias por registrarte. Para poder iniciar sesión y acceder a productos exclusivos para perfeccionar tu ecosistema tecnológico, necesitas verificar tu dirección de correo electrónico.
      </p>
      <a href="${verifyUrl}" style="display: inline-block; padding: 12px 30px; color: #ffffff; background: linear-gradient(135deg, #3b82f6, #8b5cf6); text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 20px 0; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);">Verificar Mi Cuenta</a>
      <p style="font-size: 14px; color: #94a3b8; margin-top: 30px;">
        Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
        <a href="${verifyUrl}" style="color: #3b82f6; word-break: break-all;">${verifyUrl}</a>
      </p>
      <hr style="border: none; border-top: 1px solid #1e293b; margin: 30px 0;" />
      <p style="font-size: 12px; color: #64748b;">
        Si no creaste esta cuenta, puedes ignorar este correo con total seguridad.<br>
        <strong>IMPORTANTE:</strong> Asegúrate de marcar este correo como "No es Spam" para recibir notificaciones de tus compras.
      </p>
    </div>
  `;
  await sendEmailJSRest(to, subject, html);
};

export const sendRestockEmail = async (toEmails, product) => {
  const productUrl = `${process.env.FRONTEND_URL}/product/${product._id}`;
  const subject = `¡Buenas noticias! ${product.name} vuelve a estar en stock`;
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #0b0f19; color: #f8fafc; border-radius: 12px; text-align: center; border: 1px solid #1e293b;">
      <img src="https://nova-setup.vercel.app/logo-NovaSetUp.png" alt="Nova SetUp" style="max-width: 150px; margin-bottom: 20px;" />
      <h2 style="color: #10b981; font-size: 24px; margin-bottom: 10px;">¡Ha vuelto el stock!</h2>
      <p style="font-size: 16px; color: #cbd5e1; line-height: 1.5; margin-bottom: 20px;">
        Te avisamos que el producto que tanto esperabas, <strong>${product.name}</strong>, ya tiene unidades disponibles nuevamente.
      </p>
      <img src="${product.images[0]}" alt="${product.name}" style="max-width: 250px; border-radius: 8px; margin: 20px auto; display: block; border: 2px solid #1e293b;" />
      <p style="font-size: 16px; color: #cbd5e1; margin-bottom: 25px;">¡Corre antes de que se vuelva a agotar!</p>
      <a href="${productUrl}" style="display: inline-block; padding: 12px 30px; color: #ffffff; background: linear-gradient(135deg, #10b981, #059669); text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">Comprar Ahora</a>
      <hr style="border: none; border-top: 1px solid #1e293b; margin: 30px 0;" />
      <p style="font-size: 12px; color: #64748b;">
        Recibes este correo porque solicitaste que te avisáramos sobre el stock de este producto.
      </p>
    </div>
  `;

  const promises = toEmails.map(email => sendEmailJSRest(email, subject, html));
  await Promise.allSettled(promises);
};

export const sendPasswordResetEmail = async (to, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  const subject = 'Recuperación de contraseña en Nova SetUp';
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #0b0f19; color: #f8fafc; border-radius: 12px; text-align: center; border: 1px solid #1e293b;">
      <img src="https://nova-setup.vercel.app/logo-NovaSetUp.png" alt="Nova SetUp" style="max-width: 150px; margin-bottom: 20px;" />
      <h2 style="color: #8b5cf6; font-size: 24px; margin-bottom: 10px;">Recuperación de contraseña</h2>
      <p style="font-size: 16px; color: #cbd5e1; line-height: 1.5; margin-bottom: 25px;">
        Hemos recibido una solicitud para restablecer tu contraseña en Nova SetUp. Haz clic en el botón de abajo para crear una nueva contraseña.
      </p>
      <a href="${resetUrl}" style="display: inline-block; padding: 12px 30px; color: #ffffff; background: linear-gradient(135deg, #8b5cf6, #d946ef); text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);">Restablecer Contraseña</a>
      <p style="font-size: 14px; color: #94a3b8; margin-top: 30px;">
        O copia y pega este enlace en tu navegador:<br>
        <a href="${resetUrl}" style="color: #8b5cf6; word-break: break-all;">${resetUrl}</a>
      </p>
      <hr style="border: none; border-top: 1px solid #1e293b; margin: 30px 0;" />
      <p style="font-size: 12px; color: #64748b;">
        Este enlace expirará en 15 minutos.<br>
        Si no solicitaste esto, puedes ignorar este correo de forma segura.
      </p>
    </div>
  `;
  await sendEmailJSRest(to, subject, html);
};

export const sendOrderSuccessEmail = async (to, order) => {
  const subject = '¡Tu pago ha sido aceptado! - Nova SetUp';

  // Format items nicely
  const itemsHtml = order.orderItems.map(item => `
    <tr style="border-bottom: 1px solid #1e293b;">
      <td style="padding: 15px 5px; text-align: left;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid #1e293b;" />
          <span style="color: #f8fafc; font-size: 14px;">${item.name}</span>
        </div>
      </td>
      <td style="padding: 15px 5px; text-align: center; color: #cbd5e1; font-size: 14px;">x${item.qty}</td>
      <td style="padding: 15px 5px; text-align: right; color: #10b981; font-weight: bold; font-size: 14px;">$${item.price}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #0b0f19; color: #f8fafc; border-radius: 12px; text-align: center; border: 1px solid #1e293b;">
      <img src="https://nova-setup.vercel.app/logo-NovaSetUp.png" alt="Nova SetUp" style="max-width: 150px; margin-bottom: 20px;" />
      <h2 style="color: #10b981; font-size: 24px; margin-bottom: 10px;">¡Pago Aceptado!</h2>
      <p style="font-size: 16px; color: #cbd5e1; line-height: 1.5; margin-bottom: 30px;">
        Hemos recibido tu pago correctamente. <strong>¡Te estaremos visitando pronto para entregarte tus productos!</strong>
      </p>
      
      <div style="background-color: #1e293b; border-radius: 8px; padding: 20px; text-align: left; margin-bottom: 25px;">
        <h3 style="color: #8b5cf6; margin-top: 0; margin-bottom: 15px; font-size: 18px; border-bottom: 1px solid #334155; padding-bottom: 10px;">Resumen de tu compra</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${itemsHtml}
        </table>
        <div style="margin-top: 20px; text-align: right; font-size: 18px; font-weight: bold; color: #f8fafc;">
          Total Pagado: <span style="color: #10b981; font-size: 22px;">$${order.totalPrice}</span>
        </div>
      </div>
      
      <hr style="border: none; border-top: 1px solid #1e293b; margin: 30px 0;" />
      <p style="font-size: 12px; color: #64748b;">
        Si tienes alguna duda sobre tu orden, puedes contactarnos respondiendo a este correo.
      </p>
    </div>
  `;

  await sendEmailJSRest(to, subject, html);
};
