This is the frontend for [GoopLum](https://github.com/chatrtham/gooplum-backend), built on top of Next.js, Tailwind CSS, and [assistant-ui](https://github.com/Yonom/assistant-ui).

## Getting Started

First, add your langgraph API url and assistant id to `.env.local` file:

```
NEXT_PUBLIC_API_BASE_URL="http://localhost:2024"
NEXT_PUBLIC_LANGGRAPH_ASSISTANT_ID="goopie"
```
Install the dependencies:

```bash
pnpm install
```

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

