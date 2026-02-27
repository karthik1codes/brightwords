import React from "react";
import "../App.css";
import "font-awesome/css/font-awesome.min.css";
import Services from "../Components/Home/Services";
import Intro from "../Components/Home/Intro";
import Masthead from "../Components/Home/Masthead";
import CallToAction from "../Components/Home/CallToAction";

function Home() {
  return (
    <div>
      <Masthead />
      <Intro />
      <Services />
      <CallToAction />
    </div>
  );
}

export default Home;
