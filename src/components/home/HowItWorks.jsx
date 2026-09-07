import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

function HowItWorks({ steps }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section id="como-funciona" className="how" ref={ref}>
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">O caminho até a adoção</span>
          <h2>Como funciona</h2>
        </div>

        <div className="steps-wrapper">
      

          <div className="steps">
            {steps.map((step, index) => (
              <motion.div
                className="step"
                key={step.title}
                initial={{ opacity: 0, y: 28 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.14,
                  ease: 'easeOut',
                }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                whileFocus={{ y: -4 }}
              >
                
                <div className="step-num">{String(index + 1).padStart(2, '0')}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <span className="step-arrow" aria-hidden="true">→</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
