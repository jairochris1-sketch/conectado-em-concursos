import React from 'react';
import { Instagram, Youtube, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SocialLinks() {
  const socialLinks = [
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/conectadoemconcursos/',
      icon: Instagram,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      hoverColor: 'hover:from-purple-600 hover:to-pink-600'
    },
    {
      name: 'YouTube',
      url: 'https://www.youtube.com/@ConectadoemConcursos',
      icon: Youtube,
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600'
    },
    {
      name: 'WhatsApp',
      url: 'https://chat.whatsapp.com/GZ54ocZ4HEX5TZmDEVVVg3',
      icon: MessageCircle,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.5 }}
      className="mt-16 text-center"
    >
      <h3 className="text-2xl font-bold text-white mb-6">
        Siga-nos nas redes sociais
      </h3>
      <p className="text-gray-300 mb-8">
        Fique por dentro de todas as novidades e dicas para concursos
      </p>
      
      <div className="flex justify-center gap-6">
        {socialLinks.map((social, index) => (
          <motion.a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.4 + index * 0.1, duration: 0.3 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`
              ${social.color} ${social.hoverColor}
              p-4 rounded-full shadow-2xl transition-all duration-300
              flex items-center justify-center
              transform hover:shadow-lg hover:-translate-y-1
            `}
            title={`Seguir no ${social.name}`}
          >
            <social.icon className="w-6 h-6 text-white" />
          </motion.a>
        ))}
      </div>
      
      <div className="mt-8">
        <p className="text-gray-400 text-sm">
          💬 Tem dúvidas? Entre no nosso grupo do WhatsApp!
        </p>
      </div>
    </motion.div>
  );
}