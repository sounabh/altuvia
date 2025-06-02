import React from "react";
import MyComponent from "../components/MyComponent";
import Marquee from "react-fast-marquee";

const Marquee = () => (
  <Marquee>
    <MyComponent />
    <MyComponent />
    <MyComponent />
  </Marquee>
);

export default Marquee;