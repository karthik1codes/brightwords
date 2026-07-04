import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

function CallToAction() {
  return (
    <section 
      id="cta" 
      style={{ 
        padding: "80px 0", 
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white"
      }}
    >
      <div className="container">
        <motion.div
          className="row"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="col-lg-8 mx-auto text-center">
            <h2 className="mb-4" style={{ fontSize: "2.5rem", fontWeight: "700" }}>
              Ready to Get Started?
            </h2>
            <p className="lead mb-5" style={{ fontSize: "1.3rem", opacity: "0.95" }}>
              Join thousands of users who are already using Sign Bridge to communicate 
              and learn sign language. Start your journey today!
            </p>
            <div className="d-flex justify-content-center flex-wrap gap-3">
              <Link
                to="/sign-kit/convert"
                className="btn btn-light btn-lg px-5 py-3"
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  borderRadius: "50px",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 20px rgba(0,0,0,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
                }}
              >
                Try It Free <i className="fa fa-arrow-right ms-2" />
              </Link>
              <Link
                to="/sign-kit/learn-sign"
                className="btn btn-outline-light btn-lg px-5 py-3"
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  borderRadius: "50px",
                  borderWidth: "2px",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.background = "rgba(255,255,255,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.background = "transparent";
                }}
              >
                Learn More <i className="fa fa-book ms-2" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default CallToAction;

