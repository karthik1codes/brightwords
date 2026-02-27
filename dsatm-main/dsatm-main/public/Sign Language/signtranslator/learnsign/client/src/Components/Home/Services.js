import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import imgConvert from "../../Assets/convert.png";
import imgLearnSign from "../../Assets/learn-sign.jpg";
import imgVideos from "../../Assets/videos.png";

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2,
      duration: 0.6,
      ease: "easeOut"
    }
  })
};

function Services() {
  return (
    <section id="services" style={{ padding: "80px 0" }}>
      <div className="container">
        <motion.div 
          className="row mb-5"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div
            className="col-md-12 d-flex justify-content-center align-items-center"
            style={{ flexDirection: "column" }}
          >
            <h2 className="section-heading mb-3" style={{ fontSize: "2.5rem", fontWeight: "700" }}>
              Our Services
            </h2>
            <div className="col-lg-4 divider my-3" />
            <p className="text-center normal-text col-lg-8 mx-auto" style={{ fontSize: "1.2rem", lineHeight: "1.8", color: "#555" }}>
              Discover our powerful tools designed to make sign language accessible and engaging. 
              From real-time conversion to interactive learning, we've got you covered.
            </p>
          </div>
        </motion.div>
        <div className="row">
          <motion.div 
            className="col-lg-4 col-md-6 mb-4"
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={cardVariants}
          >
            <div className="card h-100 d-flex flex-column service-card shadow-sm">
              <div className="card-img-wrapper" style={{ overflow: "hidden", height: "200px", backgroundColor: "#e3f2fd" }}>
                <img 
                  className="card-img-top" 
                  src={imgConvert} 
                  alt="Convert" 
                  style={{ 
                    objectFit: "cover", 
                    height: "100%", 
                    width: "100%",
                    transition: "transform 0.3s ease"
                  }}
                />
              </div>
              <div className="card-body d-flex flex-column">
                <h5 className="card-title mb-3" style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1976d2" }}>
                  <i className="fa fa-exchange me-2" />Convert
                </h5>
                <p className="card-text flex-grow-1" style={{ fontSize: "1rem", lineHeight: "1.7", color: "#666" }}>
                  Transform speech or text into sign language animations instantly. 
                  Speak into your microphone or type your message, and watch as our AI-powered 
                  system converts it into smooth, expressive sign language animations in real-time.
                </p>
                <Link
                  to="/sign-kit/convert"
                  className="btn btn-primary w-100 mt-auto service-btn"
                  style={{ 
                    fontSize: "1rem", 
                    fontWeight: "600",
                    padding: "12px",
                    borderRadius: "8px",
                    transition: "all 0.3s ease"
                  }}
                >
                  Try It Now <i className="fa fa-arrow-right ms-2" />
                </Link>
              </div>
            </div>
          </motion.div>
          <motion.div 
            className="col-lg-4 col-md-6 mb-4"
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={cardVariants}
          >
            <div className="card h-100 d-flex flex-column service-card shadow-sm">
              <div className="card-img-wrapper" style={{ overflow: "hidden", height: "200px", backgroundColor: "#f3e5f5" }}>
                <img 
                  className="card-img-top" 
                  src={imgLearnSign} 
                  alt="Learn Sign" 
                  style={{ 
                    objectFit: "cover", 
                    height: "100%", 
                    width: "100%",
                    transition: "transform 0.3s ease"
                  }}
                />
              </div>
              <div className="card-body d-flex flex-column">
                <h5 className="card-title mb-3" style={{ fontSize: "1.5rem", fontWeight: "600", color: "#7b1fa2" }}>
                  <i className="fa fa-graduation-cap me-2" />Learn Sign
                </h5>
                <p className="card-text flex-grow-1" style={{ fontSize: "1rem", lineHeight: "1.7", color: "#666" }}>
                  Master sign language at your own pace. Browse through our extensive library 
                  of signs, watch interactive 3D animations, and practice with our intuitive 
                  learning interface. Perfect for beginners and advanced learners alike.
                </p>
                <Link
                  to="/sign-kit/learn-sign"
                  className="btn btn-primary w-100 mt-auto service-btn"
                  style={{ 
                    fontSize: "1rem", 
                    fontWeight: "600",
                    padding: "12px",
                    borderRadius: "8px",
                    transition: "all 0.3s ease"
                  }}
                >
                  Start Learning <i className="fa fa-arrow-right ms-2" />
                </Link>
              </div>
            </div>
          </motion.div>
          <motion.div 
            className="col-lg-4 col-md-6 mb-4"
            custom={2}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={cardVariants}
          >
            <div className="card h-100 d-flex flex-column service-card shadow-sm">
              <div className="card-img-wrapper" style={{ overflow: "hidden", height: "200px", backgroundColor: "#fff3e0" }}>
                <img 
                  className="card-img-top" 
                  src={imgVideos} 
                  alt="Videos" 
                  style={{ 
                    objectFit: "cover", 
                    height: "100%", 
                    width: "100%",
                    transition: "transform 0.3s ease"
                  }}
                />
              </div>
              <div className="card-body d-flex flex-column">
                <h5 className="card-title mb-3" style={{ fontSize: "1.5rem", fontWeight: "600", color: "#e65100" }}>
                  <i className="fa fa-video-camera me-2" />Create Videos
                </h5>
                <p className="card-text flex-grow-1" style={{ fontSize: "1rem", lineHeight: "1.7", color: "#666" }}>
                  Create engaging sign language videos effortlessly. Upload your transcript, 
                  type your content, or speak directly to generate professional sign language 
                  videos. Share your creations with the community and build your library.
                </p>
                <Link
                  to="/sign-kit/all-videos"
                  className="btn btn-primary w-100 mt-auto service-btn"
                  style={{ 
                    fontSize: "1rem", 
                    fontWeight: "600",
                    padding: "12px",
                    borderRadius: "8px",
                    transition: "all 0.3s ease"
                  }}
                >
                  Browse Videos <i className="fa fa-arrow-right ms-2" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Services;
