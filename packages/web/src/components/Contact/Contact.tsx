import { useEffect, useState } from 'react';
import huubImg from '../../assets/images/team/huub.png';
import janImg from '../../assets/images/team/jan.png';
import peterImg from '../../assets/images/team/peter.png';
import Particles from '../Particles/Particles';

type FormData = {
  name: string;
  email: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const Contact = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isTablet, setIsTablet] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setWindowWidth(width);
      setIsTablet(width >= 769 && width <= 1024);
      setIsLandscape(width > height && width / height > 1.2); // Landscape if significantly wider than tall
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;
  const useMobileLayout = isMobile || isTablet;

  // Add CSS for white placeholder text and button styling
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .contact-input::placeholder {
        color: rgba(255, 255, 255, 0.7) !important;
      }
      .contact-input::-webkit-input-placeholder {
        color: rgba(255, 255, 255, 0.7) !important;
      }
      .contact-input::-moz-placeholder {
        color: rgba(255, 255, 255, 0.7) !important;
      }
      .contact-input:-ms-input-placeholder {
        color: rgba(255, 255, 255, 0.7) !important;
      }
      .contact-input:focus {
        border: 1px solid #fff !important;
        outline: none !important;
        box-shadow: none !important;
      }
      .contact-submit-btn {
        background: rgba(204,51,17,0.3) !important;
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
      }
      .contact-submit-btn:focus {
        background: rgba(204,51,17,0.3) !important;
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
      }
      .contact-submit-btn:active {
        background: rgba(204,51,17,0.3) !important;
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
      }
      .contact-submit-btn:hover {
        background: rgba(204,51,17,0.5) !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Add floating animation styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes floating1 {
        0%, 100% { transform: rotate(-5deg) translateY(0px); }
        50% { transform: rotate(-5deg) translateY(-10px); }
      }
      @keyframes floating2 {
        0%, 100% { transform: rotate(8deg) translateY(0px); }
        50% { transform: rotate(8deg) translateY(-8px); }
      }
      @keyframes floating3 {
        0%, 100% { transform: translateX(-50%) rotate(-3deg) translateY(0px); }
        50% { transform: translateX(-50%) rotate(-3deg) translateY(-12px); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    // Custom validation with Dutch messages
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Naam is verplicht';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail is verplicht';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Voer een geldig e-mailadres in';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Bericht is verplicht';
    }

    // If there are errors, show them and don't submit
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Handle form submission here
    alert('Bedankt voor uw bericht! We nemen zo spoedig mogelijk contact met u op.');

    // Reset form
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <section
      id="contact"
      data-aos="fade-in"
      style={{
        padding: useMobileLayout ? '30px 10px 0px' : '60px 20px 0px',
        background: 'linear-gradient(135deg, #FFA940, #F18825)',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Particles />
      <div
        style={{
          maxWidth: '1600px',
          margin: '0 auto',
          width: '100%',
          background: 'rgba(255, 107, 107, 0.1)',
          borderRadius: '20px',
          padding: useMobileLayout ? '20px 10px 0px' : '40px 40px 0px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            textAlign: 'left',
            marginBottom: useMobileLayout ? '1rem' : '1.5rem',
            maxWidth: useMobileLayout ? '100%' : '50%',
            width: useMobileLayout ? '100%' : 'auto',
          }}
        >
          <div
            style={{
              fontSize: '1.6rem',
              color: '#fff',
              marginBottom: '0.5rem',
              fontWeight: '400',
              fontFamily:
                'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
            }}
          >
            • Contact
          </div>
          <h2
            style={{
              fontSize: useMobileLayout ? '2rem' : '2.5rem',
              margin: '0',
              color: '#fff',
              fontWeight: '600',
              fontFamily:
                'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
            }}
          >
            Neem contact op met onze experts
          </h2>
        </div>

        <div
          style={{
            display: useMobileLayout ? 'flex' : 'grid',
            flexDirection: useMobileLayout ? 'column' : 'row',
            gridTemplateColumns: useMobileLayout ? 'none' : 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem',
            alignItems: 'start',
            marginBottom: '0',
          }}
        >
          {/* Contact Form */}
          <div style={{ width: '100%', marginBottom: useMobileLayout ? '1rem' : '0' }}>
            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}
            >
              {/* Name and Email Row */}
              <div
                style={{
                  display: 'flex',
                  gap: useMobileLayout ? '0.5rem' : '1rem',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: useMobileLayout ? '0.5rem' : '1rem',
                    flexDirection: 'row',
                  }}
                >
                  <div style={{ flex: '1' }}>
                    <input
                      type="text"
                      name="name"
                      placeholder="Uw naam"
                      value={formData.name}
                      onChange={handleChange}
                      className="contact-input"
                      style={{
                        padding: useMobileLayout ? '0.8rem' : '1rem',
                        border: errors.name ? '2px solid #ff4444' : 'none',
                        borderRadius: '25px',
                        fontSize: useMobileLayout ? '0.9rem' : '1rem',
                        width: '100%',
                        boxSizing: 'border-box',
                        background: 'rgba(204,51,17,0.3)',
                        color: '#fff',
                      }}
                    />
                    {errors.name && (
                      <div
                        style={{
                          color: '#fff',
                          fontSize: '0.85rem',
                          marginTop: '0.25rem',
                          marginLeft: '1rem',
                          fontFamily:
                            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
                        }}
                      >
                        {errors.name}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: '1' }}>
                    <input
                      type="email"
                      name="email"
                      placeholder="Uw e-mail"
                      value={formData.email}
                      onChange={handleChange}
                      className="contact-input"
                      style={{
                        padding: useMobileLayout ? '0.8rem' : '1rem',
                        border: errors.email ? '2px solid #ff4444' : 'none',
                        borderRadius: '25px',
                        fontSize: useMobileLayout ? '0.9rem' : '1rem',
                        width: '100%',
                        boxSizing: 'border-box',
                        background: 'rgba(204,51,17,0.3)',
                        color: '#fff',
                      }}
                    />
                    {errors.email && (
                      <div
                        style={{
                          color: '#fff',
                          fontSize: '0.85rem',
                          marginTop: '0.25rem',
                          marginLeft: '1rem',
                          fontFamily:
                            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
                        }}
                      >
                        {errors.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <textarea
                  name="message"
                  placeholder="Uw bericht"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className="contact-input"
                  style={{
                    padding: useMobileLayout ? '0.8rem' : '1rem',
                    border: errors.message ? '2px solid #ff4444' : 'none',
                    borderRadius: '25px',
                    fontSize: useMobileLayout ? '0.9rem' : '1rem',
                    resize: 'vertical',
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(204,51,17,0.3)',
                    color: '#fff',
                    fontFamily:
                      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
                  }}
                />
                {errors.message && (
                  <div
                    style={{
                      color: '#fff',
                      fontSize: '0.85rem',
                      marginTop: '0.25rem',
                      marginLeft: '1rem',
                      fontFamily:
                        'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
                    }}
                  >
                    {errors.message}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="contact-submit-btn"
                style={{
                  padding: '0.5rem 1rem',
                  color: '#fff',
                  borderRadius: '25px',
                  fontSize: useMobileLayout ? '0.9rem' : '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  width: 'auto',
                  alignSelf: 'flex-start',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Verzenden
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#fff',
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#F18825',
                    }}
                  >
                    →
                  </span>
                </span>
              </button>
            </form>
          </div>

          {/* Three Images Layout */}
          <div
            style={{
              position: 'relative',
              height: 'auto',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              width: '100%',
              minHeight: 'fit-content',
              marginTop: useMobileLayout ? '3rem' : '0',
              marginBottom: useMobileLayout ? '3rem' : '0',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: useMobileLayout ? '350px' : '400px',
                transform: useMobileLayout ? 'translateY(0px)' : 'translateY(-120px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Image 1 - Top Left */}
              <img
                src={peterImg}
                alt="Peter de Keijzer"
                data-aos="fade-right"
                data-aos-delay="100"
                style={{
                  position: 'absolute',
                  top: useMobileLayout ? '10px' : '0px',
                  left: '20px',
                  width:
                    isMobile && !isLandscape
                      ? '120px'
                      : isLandscape
                        ? '180px'
                        : isTablet
                          ? '160px'
                          : '200px',
                  height:
                    isMobile && !isLandscape
                      ? '120px'
                      : isLandscape
                        ? '180px'
                        : isTablet
                          ? '160px'
                          : '200px',
                  borderRadius: '12px',
                  objectFit: 'cover',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                  transform: 'rotate(-5deg)',
                  animation: 'floating1 3s ease-in-out infinite',
                  zIndex: 3,
                }}
              />

              {/* Image 2 - Top Right */}
              <img
                src={huubImg}
                alt="Huub Jansen"
                data-aos="fade-left"
                data-aos-delay="200"
                style={{
                  position: 'absolute',
                  top: useMobileLayout ? '30px' : '20px',
                  right: '20px',
                  width:
                    isMobile && !isLandscape
                      ? '130px'
                      : isLandscape
                        ? '190px'
                        : isTablet
                          ? '170px'
                          : '220px',
                  height:
                    isMobile && !isLandscape
                      ? '130px'
                      : isLandscape
                        ? '190px'
                        : isTablet
                          ? '170px'
                          : '220px',
                  borderRadius: '12px',
                  objectFit: 'cover',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                  transform: 'rotate(8deg)',
                  animation: 'floating2 3.2s ease-in-out infinite 0.5s',
                  zIndex: 4,
                }}
              />

              {/* Image 3 - Bottom Center */}
              <img
                src={janImg}
                alt="Jan Pouw"
                data-aos="fade-up"
                data-aos-delay="300"
                style={{
                  position: 'absolute',
                  bottom: useMobileLayout ? '20px' : '0px',
                  left: '50%',
                  transform: 'translateX(-50%) rotate(-3deg)',
                  width: useMobileLayout
                    ? '150px'
                    : isLandscape
                      ? '220px'
                      : isTablet
                        ? '200px'
                        : '260px',
                  height: useMobileLayout
                    ? '150px'
                    : isLandscape
                      ? '220px'
                      : isTablet
                        ? '200px'
                        : '260px',
                  borderRadius: '12px',
                  objectFit: 'cover',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                  animation: 'floating3 3.5s ease-in-out infinite 1s',
                  zIndex: 5,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
