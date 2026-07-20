# Virtual Physics Labs

Welcome to the **Semiconductor Virtual Labs** – an interactive platform designed to simulate and explore key semiconductor experiments in a visually rich and intuitive way. This project aims to make complex physics concepts accessible through dynamic visualizations, interactive UI, and real-time feedback.

## 🔬 Lab Overview

Our virtual lab currently focuses on semiconductor experiments with special emphasis on:

- **Hall Effect Experiment**: Visualize the relationship between magnetic field strength and the Hall voltage.
- **IV Characteristics of a Diode**: Observe the dynamic change in current with respect to applied voltage.
- **Zener Diode Behavior**: Analyze the breakdown behavior under reverse bias.
- **Transistor Characteristics**: Interactive plotting of output and transfer characteristics.

Each experiment features:

- 📊 **Dynamic Graphs** rendered with `Recharts`
- 🎛️ **Interactive Controls** for user-defined input
- 📋 **Real-time Feedback** and explanation of observations

## 🚀 Tech Stack

### Frontend

- **[React](https://reactjs.org/)**: Component-based UI
- **[Vite](https://vitejs.dev/)**: Lightning-fast development and build tool
- **[TypeScript](https://www.typescriptlang.org/)**: Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first styling
- **[Radix UI](https://www.radix-ui.com/)**: Accessible headless components
- **[shadcn/ui](https://ui.shadcn.dev/)**: Pre-built component system with Radix + Tailwind
- **[Recharts](https://recharts.org/en-US/)**: Charting library for graph visualizations
- **[Framer Motion](https://www.framer.com/motion/)**: Smooth animations
- **[React Router](https://reactrouter.com/)**: Client-side routing
- **[React Hook Form](https://react-hook-form.com/)** + **[Zod](https://zod.dev/)**: Forms & validation
- **[React Query](https://tanstack.com/query/latest)**: Server state management and async fetching

### Additional Libraries

- **Three.js + React Three Drei**: For future integration of 3D lab environments
- **Lucide React**: Icon library
- **Embla Carousel, Resizable Panels**: Enhanced UX components

### Dev Tooling

- **ESLint**: Linting and code quality
- **Prettier**: Code formatting
- **TypeScript ESLint**: Static type checking
- **Tailwind Merge + Class Variance Authority**: Class name optimization
- **PostCSS + Autoprefixer**: CSS processing

---

## 📁 Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Route-based lab pages
├── labs/           # Specific experiment logic & visualization
├── assets/         # Images and static files
├── utils/          # Helpers and utilities
└── App.tsx         # App entry point
```

---

## 🛠️ Setup

x

```bash
# Clone the repository
git clone https://github.com/itzayush69/srm-virtual-labs.git

# Navigate to project directory
cd srm-virtual-labs

# Install dependencies
npm install

# Run the development server
npm run dev
```

---

## 🧪 Contributions

We welcome contributions to add more experiments, improve UI, or enhance functionality. Please feel free to open an issue or submit a pull request!

---

## 📜 License

This project is open-source and available under the MIT License.
