import SmoothScroll from "@/components/SmoothScroll";
import Loader from "@/components/Loader";
import Cursor from "@/components/Cursor";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";

export default function Home() {
  return (
    <main>
      <SmoothScroll />
      <Loader />
      <Cursor />
      <Nav />
      <Hero />
      <About />
      <Projects />
      <Contact />
    </main>
  );
}
