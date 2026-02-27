import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const heading = "Welcome to Sign Bridge!";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.2,
    },
  },
};

const child = {
  hidden: { opacity: 0, y: 30, scale: 0.8 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 500, damping: 30 },
  },
};

function Masthead() {
  return (
    <div className="container-fluid d-flex justify-content-center align-items-center home-gradient">
      <div
        className="row d-flex justify-content-center align-items-center"
        style={{ flexDirection: "column", minHeight: "calc(100vh - 70px)" }}
      >
        <motion.div
          className="col-lg-8 col-md-10 welcome-title text-center px-4"
          variants={container}
          initial="hidden"
          animate="show"
          style={{ letterSpacing: "0.5px" }}
        >
          {heading.split("").map((char, idx) => (
            <motion.span
              key={idx}
              variants={child}
              style={{
                display: "inline-block",
                marginRight: char === " " ? "0.3em" : "0",
              }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>
        <div className="col-lg-4 divider my-4" />
        <motion.div
          className="col-lg-8 col-md-10 subtitle text-center px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <p className="lead mb-4" style={{ fontSize: "1.5rem", fontWeight: "500", lineHeight: "1.8" }}>
            Bridge the communication gap with our comprehensive Sign Language toolkit. 
            Transform speech, text, and ideas into expressive sign language animations 
            and foster inclusive communication for everyone.
          </p>
          <p style={{ fontSize: "1.1rem", color: "#555", marginBottom: "2rem" }}>
            Explore our innovative features designed to make sign language accessible, 
            interactive, and easy to learn.
          </p>
        </motion.div>
        <motion.div 
          className="d-flex justify-content-center mt-4 flex-wrap gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          <Link 
            className="btn btn-primary btn-lg px-5 py-3 hero-btn-primary" 
            to="/sign-kit/convert"
            style={{ 
              fontSize: "1.1rem", 
              fontWeight: "600",
              borderRadius: "50px",
              boxShadow: "0 4px 15px rgba(0,123,255,0.3)",
              transition: "all 0.3s ease"
            }}
          >
            Get Started <i className="fa fa-arrow-right ms-2" />
          </Link>
          <a 
            className="btn btn-outline-light btn-lg px-5 py-3 hero-btn-secondary" 
            href="#services"
            style={{ 
              fontSize: "1.1rem", 
              fontWeight: "600",
              borderRadius: "50px",
              borderWidth: "2px",
              transition: "all 0.3s ease"
            }}
          >
            Learn More <i className="fa fa-angle-down ms-2" />
          </a>
        </motion.div>
      </div>
    </div>
  );
}

export default Masthead;
