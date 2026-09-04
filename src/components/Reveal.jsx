import { Children, isValidElement } from 'react';
import { motion } from 'framer-motion';

function Reveal({ children, className = '', delay = 0, as = 'div' }) {
  const MotionTag = motion[as] ?? motion.div;
  const hasHeading = Children.toArray(children).some(
    (child) => isValidElement(child) && typeof child.type === 'string' && /^h[1-6]$/i.test(child.type)
  );

  return (
    <MotionTag
      className={className}
      initial={hasHeading ? { opacity: 0 } : { opacity: 0, y: 32 }}
      whileInView={hasHeading ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, delay: delay / 1000, ease: 'easeOut' }}
    >
      {children}
    </MotionTag>
  );
}

export default Reveal
