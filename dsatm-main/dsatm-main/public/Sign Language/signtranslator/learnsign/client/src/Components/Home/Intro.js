import React from "react";
import { motion } from "framer-motion";

function Intro() {
  return (
    <section id="intro" style={{ padding: "80px 0", backgroundColor: "#f8f9fa" }}>
      <div className="container">
        <div className="row my-5">
          <motion.div
            className="col-md-12 d-flex justify-content-center align-items-center"
            style={{ flexDirection: "column" }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="section-heading mb-3" style={{ fontSize: "2.5rem", fontWeight: "700" }}>
              Everything You Need in One Place
            </h2>
            <div className="col-lg-4 divider my-3" />
            <p className="text-center normal-text col-lg-8 mx-auto" style={{ fontSize: "1.2rem", lineHeight: "1.8", color: "#555" }}>
              Sign Bridge is your complete solution for sign language communication and learning. 
              Our platform combines cutting-edge technology with an intuitive interface to provide 
              a seamless experience for converting speech to sign language, learning signs, and 
              creating engaging video content.
            </p>
            <div className="row mt-5">
              <div className="col-md-4 text-center mb-4 mb-md-0">
                <div className="feature-icon mb-3" style={{ fontSize: "3rem" }}>🎯</div>
                <h4 style={{ fontWeight: "600", marginBottom: "1rem" }}>Easy to Use</h4>
                <p style={{ color: "#666" }}>Intuitive interface designed for users of all technical levels</p>
              </div>
              <div className="col-md-4 text-center mb-4 mb-md-0">
                <div className="feature-icon mb-3" style={{ fontSize: "3rem" }}>⚡</div>
                <h4 style={{ fontWeight: "600", marginBottom: "1rem" }}>Fast & Accurate</h4>
                <p style={{ color: "#666" }}>Real-time conversion with high accuracy and smooth animations</p>
              </div>
              <div className="col-md-4 text-center">
                <div className="feature-icon mb-3" style={{ fontSize: "3rem" }}>🌟</div>
                <h4 style={{ fontWeight: "600", marginBottom: "1rem" }}>Comprehensive</h4>
                <p style={{ color: "#666" }}>Full suite of tools for learning, converting, and creating content</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Intro;
