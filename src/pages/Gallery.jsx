import { useState, useEffect } from "react";
import { ChevronRight, X } from "lucide-react";
import Reveal from '../components/Reveal';

const Gallery = () => {
  const [allImages, setAllImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showAllModal, setShowAllModal] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch("/api/gallery");
        if (!response.ok) {
          throw new Error("Hey mehn failed to load gallery");
        }
        const data = await response.json();
        const mapped = data.map(img => ({
          src: img.src,
          alt: img.caption,
          id: img.id,
        }));
        setAllImages(mapped);
      } catch (error) {
        console.error("Howdy! Error loading gallery:", error);
        setAllImages([
          { src: "/anika team.jpg", alt: "Anika Team" },
          { src: "/jaaziya.jpg", alt: "Jaaziya" },
          { src: "/KWAJ.jpg", alt: "KWAJ" },
        ]);
      }
    };

    fetchImages();
  }, []);

  const galleryItems = allImages.slice(0, 6);

  const openLightbox = (item) => {
    setSelectedImage(item);
    setShowAllModal(false);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = "auto";
  };

  const handleViewAll = () => {
    setShowAllModal(true);
  };

  return (
    <div className="font-body bg-cream text-[#1E1A18] min-h-screen">
      <section className="relative overflow-hidden bg-charcoal text-cream py-16 md:py-12">
        <img
          src="/anika-flower.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 w-md rotate-0 opacity-90"
        />
        <div className="relative z-10 mx-auto max-w-6xl px-6">
          <Reveal>
            <h1 className="text-5xl md:text-7xl font-bold text-white font-display tracking-wider leading-tight">
              GALLERY
            </h1>
          </Reveal>
          <Reveal delay={150}>
            <p className="mt-4 max-w-2xl text-lg text-[#E6A15E] font-editorial italic">
              The rooms, the mics, the faces. Art airing in real time.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Gallery Grid Section */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
          <div>
            <Reveal>
              <span className="text-[#E6A15E] font-semibold text-sm tracking-[0.2em] uppercase">
                Moments
              </span>
            </Reveal>
            <Reveal delay={100}>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 text-[#1E1A18]">
                The rooms, the mics, the faces.
              </h2>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-2 max-w-2xl text-base text-gray-600">
                Art airing in real time. Moments where something shifts.
              </p>
            </Reveal>
          </div>
          <Reveal delay={300}>
            <button
              onClick={handleViewAll}
              className="mt-4 md:mt-0 inline-flex items-center gap-2 text-[#E6A15E] font-medium hover:gap-3 transition-all duration-300 group cursor-pointer"
            >
              <span>View all</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryItems.map((item, index) => (
            <Reveal key={item.src} delay={index * 100}>
              <div
                className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 bg-gray-200 aspect-[4/3] cursor-pointer"
                onClick={() => openLightbox(item)}
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-5">
                  <span className="text-[#E6A15E] font-medium text-sm tracking-wide bg-[#1E1A18]/80 backdrop-blur-sm px-4 py-2 rounded-full border border-[#E6A15E]/30 shadow-lg">
                    {item.alt}
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          <div
            className="relative max-w-6xl w-full max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-[#E6A15E] transition-colors z-10 bg-black/50 rounded-full p-2.5 hover:bg-black/70"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="w-full h-auto max-h-[85vh] object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <p className="text-[#E6A15E] text-lg font-medium tracking-wide">
                {selectedImage.alt}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* View All Modal */}
      {showAllModal && (
        <div
          className="fixed inset-0 bg-black/95 z-50 overflow-y-auto p-4 backdrop-blur-sm"
          onClick={() => setShowAllModal(false)}
        >
          <div
            className="mx-auto max-w-6xl px-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-white tracking-tight">
                All <span className="text-[#E6A15E]">Moments</span>
              </h2>
              <button
                onClick={() => setShowAllModal(false)}
                className="text-white hover:text-[#E6A15E] transition-colors bg-white/10 rounded-full p-2.5 hover:bg-white/20"
              >
                <X className="w-8 h-8" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {allImages.map((item) => (
                <div
                  key={item.src}
                  className="aspect-square overflow-hidden rounded-lg cursor-pointer hover:scale-105 transition-transform duration-300 bg-gray-800 shadow-md hover:shadow-xl"
                  onClick={() => openLightbox(item)}
                >
                  <img
                    src={item.src}
                    alt={item.alt}
                    className="w-full h-full object-cover hover:brightness-110 transition-all"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;