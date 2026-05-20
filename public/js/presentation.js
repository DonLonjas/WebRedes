// js/presentation.js - Lógica de presentación de slides

let slides = [];
let currentSlideIndex = 0;

// Cargar slides desde el servidor
async function loadSlides() {
  try {
    // Intentar cargar desde el servidor
    const response = await fetch('/data/slides.json');
    if (response.ok) {
      const data = await response.json();
      slides = data.slides;
    } else {
      // Fallback: slides hardcodeados
      slides = getDefaultSlides();
    }
    displaySlide(0);
  } catch (error) {
    console.error('Error cargando slides:', error);
    // Usar slides por defecto
    slides = getDefaultSlides();
    displaySlide(0);
  }
}

function getDefaultSlides() {
  return [
    {
      id: 1,
      title: "Introducción al Espectro Electromagnético",
      subtitle: "Una onda de energía que viaja por el universo",
      content: "El espectro electromagnético es el rango completo de todas las posibles frecuencias de radiación electromagnética. Desde las ondas de radio de baja frecuencia hasta los rayos gamma de alta frecuencia.",
      extendedContent: "Todas las formas de radiación electromagnética viajan a la velocidad de la luz en el vacío.",
      frequency: "Variable",
      wavelength: "Variable",
      energy: "Variable",
      applications: ["Visión conceptual"],
      image: "/images/slide-1-spectrum.png"
    },
    {
      id: 2,
      title: "Ondas de Radio",
      subtitle: "Las ondas más largas y de menor energía",
      content: "Tienen las longitudes de onda más largas del espectro. Se usan en radiodifusión AM/FM, televisión, comunicaciones de larga distancia, WiFi y Bluetooth.",
      extendedContent: "Las ondas de radio fueron descubiertas por Heinrich Hertz en 1887 y son invisibles pero captadas por nuestros receptores.",
      frequency: "3 kHz a 300 GHz",
      wavelength: "1 mm a 100 km",
      energy: "Muy baja",
      applications: ["Radio AM/FM", "WiFi", "Bluetooth", "Televisión", "Teléfonos móviles"],
      image: "/images/slide-2-radio.png"
    },
    {
      id: 3,
      title: "Microondas",
      subtitle: "Usadas en cocina y comunicaciones",
      content: "Las microondas calientan los alimentos haciendo vibrar las moléculas de agua. También se usan en satélites, radares y telecomunicaciones de corta distancia.",
      extendedContent: "El horno microondas fue inventado por Percy Spencer en 1945. Las microondas de 2.45 GHz coinciden con la resonancia del agua.",
      frequency: "300 MHz a 300 GHz",
      wavelength: "1 mm a 1 m",
      energy: "Baja a media",
      applications: ["Hornos microondas", "Satélites", "Radar", "Comunicaciones"],
      image: "/images/slide-3-microwaves.png"
    },
    {
      id: 4,
      title: "Radiación Infrarroja",
      subtitle: "El calor que sentimos",
      content: "La radiación infrarroja es invisible para nuestros ojos pero la sentimos como calor. Se usa en termografía, mandos a distancia, visión nocturna y sistemas de calefacción.",
      extendedContent: "William Herschel descubrió la radiación infrarroja en 1800. Los cuerpos a temperatura ambiente emiten principalmente radiación infrarroja.",
      frequency: "300 GHz a 430 THz",
      wavelength: "700 nm a 1 mm",
      energy: "Media",
      applications: ["Termografía", "Mandos a distancia", "Visión nocturna", "Calefacción"],
      image: "/images/slide-4-infrared.png"
    },
    {
      id: 5,
      title: "Luz Visible",
      subtitle: "Lo único que nuestros ojos pueden ver",
      content: "Es la única parte del espectro que nuestros ojos pueden detectar. Se divide en 7 colores del arcoíris: rojo, naranja, amarillo, verde, azul, índigo y violeta.",
      extendedContent: "El rojo tiene la longitud de onda más larga (~700 nm) y el violeta la más corta (~380 nm).",
      frequency: "430 THz a 770 THz",
      wavelength: "380 nm a 700 nm",
      energy: "Media",
      applications: ["Visión", "Fotosíntesis", "Iluminación", "Fibra óptica"],
      image: "/images/slide-5-visible.png"
    },
    {
      id: 6,
      title: "Radiación Ultravioleta",
      subtitle: "Invisible pero poderosa",
      content: "Es lo que causa quemaduras solares. Se usa en esterilización UV, en insecticidas y en astrofísica para estudiar las estrellas jóvenes.",
      extendedContent: "La radiación UV del sol es bloqueada principalmente por la capa de ozono. Los protectores solares tienen un SPF que indica cuánta radiación UV bloquean.",
      frequency: "770 THz a 30 PHz",
      wavelength: "10 nm a 380 nm",
      energy: "Alta",
      applications: ["Protección solar", "Esterilización UV", "Astrofísica", "Forensia"],
      image: "/images/slide-6-ultraviolet.png"
    },
    {
      id: 7,
      title: "Rayos X",
      subtitle: "Penetran la materia",
      content: "Los rayos X pueden penetrar la piel y otros tejidos blandos. Se usan en medicina para radiografías, en seguridad aeroportuaria, en cristalografía y en astronomía de rayos X.",
      extendedContent: "Fueron descubiertos por Wilhelm Röntgen en 1895. La cristalografía de rayos X reveló la estructura del ADN.",
      frequency: "30 PHz a 30 EHz",
      wavelength: "0.01 nm a 10 nm",
      energy: "Muy alta",
      applications: ["Radiografías médicas", "Seguridad", "Cristalografía", "Astronomía"],
      image: "/images/slide-7-xrays.png"
    },
    {
      id: 8,
      title: "Rayos Gamma",
      subtitle: "La radiación más energética",
      content: "Son la radiación más energética. Se generan en reacciones nucleares, decaimiento radiactivo y en el universo (supernovas, agujeros negros).",
      extendedContent: "Los rayos gamma se producen en decaimientos radiactivos. En medicina, se usan en cantidades controladas para destruir células cancerosas.",
      frequency: "> 30 EHz",
      wavelength: "< 0.01 nm",
      energy: "Extremadamente alta",
      applications: ["Radioterapia", "Esterilización médica", "Astrofísica", "Física nuclear"],
      image: "/images/slide-8-gamma.png"
    }
  ];
}

function displaySlide(index) {
  if (index < 0) index = slides.length - 1;
  if (index >= slides.length) index = 0;

  currentSlideIndex = index;
  const slide = slides[index];
  const isFirstSlide = index === 0;

  // Título y subtítulo
  document.getElementById('slideTitle').textContent = slide.title;
  document.getElementById('slideSubtitle').textContent = slide.subtitle;
  
  // Contenido principal
  document.getElementById('slideContent').textContent = slide.content;
  
  // Contenido extendido
  const extendedContentEl = document.getElementById('slideExtendedContent');
  if (slide.extendedContent) {
    extendedContentEl.textContent = slide.extendedContent;
    extendedContentEl.style.display = 'block';
  } else {
    extendedContentEl.style.display = 'none';
  }

  // Imagen
  const imageEl = document.getElementById('slideImage');
  imageEl.innerHTML = '';
  if (slide.image) {
    if (slide.image.includes('/')) {
      // Es una URL de imagen
      const img = document.createElement('img');
      img.src = slide.image;
      img.alt = slide.title;
      imageEl.appendChild(img);
    } else {
      // Es un emoji
      imageEl.textContent = slide.image;
      imageEl.style.fontSize = '6rem';
    }
  }

  // Mostrar/ocultar cajas de info solo si no es el primer slide
  const spectrumInfo = document.getElementById('spectrumInfo');
  const applicationsBox = document.getElementById('applicationsBox');
  
  if (isFirstSlide) {
    spectrumInfo.style.display = 'none';
    applicationsBox.style.display = 'none';
  } else {
    spectrumInfo.style.display = 'grid';
    applicationsBox.style.display = 'block';
    
    // Llenar información técnica
    document.getElementById('frequency').textContent = slide.frequency;
    document.getElementById('wavelength').textContent = slide.wavelength;
    document.getElementById('energy').textContent = slide.energy;

    // Llenar aplicaciones
    const appsList = document.getElementById('applicationsList');
    appsList.innerHTML = '';
    if (slide.applications && slide.applications.length > 0) {
      slide.applications.forEach(app => {
        const li = document.createElement('li');
        li.textContent = app;
        appsList.appendChild(li);
      });
    }
  }

  // Indicador y progreso
  document.getElementById('slideIndicator').textContent = `${index + 1} / ${slides.length}`;
  document.getElementById('slideProgress').value = index + 1;

  // Actualizar slider
  document.getElementById('spectrumSlider').value = index + 1;

  // Actualizar degradado de la barra según el slide
  updateSpectrumGradient(index);
}

// Devuelve un degradado CSS acorde a la banda del espectro para cada slide
function getGradientForIndex(index) {
  // Mapear índices a degradados (0 = intro -> arcoíris completo)
  const gradients = [
    // Intro: arcoíris completo
    'linear-gradient(90deg, #ff0000 0%, #ff7f00 16%, #ffff00 32%, #A3D139 48%, #247bf7 64%, #4b0082 80%, #800080 100%)',
    // Ondas de Radio
    'linear-gradient(90deg, #ff0000, #ff7f00)',
    // Microondas
    'linear-gradient(90deg, #ff7f00, #ffff00)',
    // Infrarrojo
    'linear-gradient(90deg, #ffff00, #ff0000)',
    // Luz visible
    'linear-gradient(90deg, #ff0000, #ff00ff)',
    // Ultravioleta
    'linear-gradient(90deg, #ff00ff, #800080)',
    // Rayos X
    'linear-gradient(90deg, #800080, #4b0082)',
    // Rayos Gamma
    'linear-gradient(90deg, #4b0082, #000000)'
  ];

  return gradients[index] || gradients[0];
}

function updateSpectrumGradient(index) {
  const slider = document.getElementById('spectrumSlider');
  const progress = document.getElementById('slideProgress');
  const grad = getGradientForIndex(index);

  if (slider) {
    // Aplicar degradado al fondo del range
    slider.style.background = grad;
    slider.style.transition = 'background 300ms ease';
  }

  if (progress) {
    // Algunos navegadores ignorarán background en <progress>, pero intentamos aplicarlo
    progress.style.background = grad;
    progress.style.borderRadius = '8px';
  }
}

// Event listeners
document.getElementById('nextBtn')?.addEventListener('click', () => {
  displaySlide(currentSlideIndex + 1);
});

document.getElementById('prevBtn')?.addEventListener('click', () => {
  displaySlide(currentSlideIndex - 1);
});

document.getElementById('spectrumSlider')?.addEventListener('input', (e) => {
  displaySlide(parseInt(e.target.value) - 1);
});

// Teclas de navegación
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') displaySlide(currentSlideIndex + 1);
  if (e.key === 'ArrowLeft') displaySlide(currentSlideIndex - 1);
});

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  await fetch('/auth/logout', { method: 'POST' });
  window.location.href = '/';
});

// Cargar datos del usuario
async function loadUserData() {
  try {
    const response = await fetch('/auth/me');
    const data = await response.json();

    if (data.user) {
      const userDisplay = document.getElementById('userDisplay');
      if (userDisplay) {
        userDisplay.textContent = `${data.user.avatar} ${data.user.displayName}`;
      }
    } else {
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Error:', error);
    window.location.href = '/';
  }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  loadUserData();
  loadSlides();
});
