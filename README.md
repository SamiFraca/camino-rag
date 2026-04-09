# Camino RAG - Camino de Santiago Route Planner

A RAG (Retrieval-Augmented Generation) application that helps plan Camino de Santiago pilgrimage routes using AI. The system combines keyword search with vector similarity to provide personalized route recommendations based on user preferences and constraints.

## Features

- **AI-Powered Route Planning**: Uses GPT-4o-mini to generate personalized Camino routes
- **Dual Search System**: Combines BM25 keyword search with vector similarity for accurate results
- **Route Validation**: Automatically validates generated plans against real Camino data
- **Flexible Constraints**: Supports different experience levels and distance preferences
- **Comprehensive Database**: Contains detailed information about multiple Camino routes
- **Web Interface**: Interactive 3D visualization frontend using Vue.js and Three.js

## Architecture

The application consists of two main components:

### Backend (TypeScript)
- **RAG System** (`src/rag.ts`): Creates vector indices from Camino stage data
- **Query Engine** (`src/query.ts`): Processes user questions and generates validated routes
- **Keyword Search** (`src/keywords.ts`): BM25-based search for stage matching
- **Main Entry** (`src/index.ts`): CLI interface for testing

### Frontend (Vue.js/Nuxt)
- **3D Visualization**: Interactive map using Three.js and TresJS
- **User Interface**: Modern web interface for route planning
- **Components**: Reusable Vue components for different UI elements

## Data Structure

The application uses a comprehensive JSON database (`data/stages.json`) containing:
- Multiple Camino routes (Francés, Portugués, del Norte, etc.)
- Stage information (distance, difficulty, elevation gain)
- Detailed descriptions and route connections
- 400+ stages across different routes

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key (for GPT-4o-mini access)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd camino-rag
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file in root directory
   echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
   ```

### Running the Application

#### Backend (CLI)

1. **Run the main application**
   ```bash
   npm start
   ```
   
   This will execute the sample question: "What is the best way to start the Camino in Galicia?"

2. **Run with custom questions**
   ```bash
   # Modify src/index.ts to change the question, then run:
   npm start
   ```

#### Frontend (Web Interface)

1. **Start the development server**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Access the application**
   - Open your browser to `http://localhost:3000`
   - The web interface provides an interactive way to plan routes

## How It Works

### 1. Data Processing
- The application loads Camino stage data from `data/stages.json`
- Stages are filtered based on user constraints (max distance, difficulty level)
- Data is converted to LlamaIndex documents for vector indexing

### 2. Hybrid Search System
- **Keyword Search**: Uses BM25 algorithm to find stages matching user queries
- **Vector Search**: Uses OpenAI embeddings to find semantically similar stages
- Results are combined to provide the most relevant stage suggestions

### 3. AI Route Generation
- User questions are parsed for constraints (days, experience level)
- GPT-4o-mini generates route plans based on available stages
- The system includes all available stages in the prompt to prevent hallucination

### 4. Validation & Retry Logic
- Generated plans are validated against the actual stage database
- Checks for: stage existence, distance limits, route continuity, day count
- If validation fails, the system retries with error feedback (up to 3 attempts)

### 5. Output Formatting
- Validated routes are returned in a structured format
- Includes route name, daily stages, distances, and reasoning
- Validation summary shows total distance and average difficulty

## Example Usage

### CLI Example
```bash
npm start
```

Sample output:
```
Route: Camino Francés
Start: Sarria (popular final stretch)
Day 1: Sarria → Portomarín (~22 km, easy)
Day 2: Portomarín → Palas de Rei (~25 km, medium)
Day 3: Palas de Rei → Arzúa (~29 km, medium)
Day 4: Arzúa → Santiago (~39 km, note: combines last 2 stages)

Why:
- avoids difficult mountain start
- fits 4-day constraint
- most popular final stretch

---
✓ Plan validated: 4 days, 115km total, avg difficulty: medium
```

### Supported Query Types
- "Plan a 7-day beginner Camino route"
- "What's the best way to start the Camino in Galicia?"
- "5-day experienced route from Pamplona"
- "Easy coastal route for 10 days"

## Development

### Project Structure
```
camino-rag/
├── src/                    # Backend TypeScript code
│   ├── index.ts           # Main CLI entry point
│   ├── rag.ts             # RAG system and indexing
│   ├── query.ts           # Query processing and validation
│   └── keywords.ts        # BM25 keyword search
├── frontend/              # Vue.js frontend
│   ├── pages/             # Nuxt pages
│   ├── components/        # Vue components
│   └── assets/            # Static assets
├── data/                  # Data files
│   └── stages.json        # Camino stages database
└── package.json           # Backend dependencies
```

### Adding New Routes
1. Update `data/stages.json` with new stage information
2. Follow the existing schema: route, stage, stage_number, from, to, distance_km, difficulty, elevation_gain, text
3. Ensure stage_number is sequential within each route
4. Test with various queries to validate integration

### Customizing Constraints
Modify the `StageConstraints` interface and related logic in `src/query.ts`:
```typescript
interface StageConstraints {
  maxKm: number;           // Maximum daily distance
  level: "beginner" | "experienced";
}
```

## Troubleshooting

### Common Issues

1. **TypeScript Declaration Errors**
   - If you encounter declaration errors for `wink-bm25-text-search`, the application includes type definitions
   - Ensure you're using Node.js 18+ and have all dependencies installed

2. **OpenAI API Errors**
   - Verify your `OPENAI_API_KEY` is correctly set in the `.env` file
   - Check your OpenAI API quota and billing settings

3. **Memory Issues**
   - The application processes all stages in memory
   - For very large datasets, consider implementing pagination or chunking

4. **Frontend Build Issues**
   - Ensure all frontend dependencies are installed: `cd frontend && npm install`
   - Clear Nuxt cache: `rm -rf .nuxt` in the frontend directory

## Technologies Used

### Backend
- **TypeScript**: Type-safe JavaScript
- **LlamaIndex**: RAG framework
- **OpenAI**: GPT-4o-mini for route generation
- **wink-bm25-text-search**: BM25 keyword search
- **tsx**: TypeScript execution

### Frontend
- **Vue.js 3**: Progressive JavaScript framework
- **Nuxt 3**: Vue.js meta-framework
- **Three.js**: 3D graphics library
- **TresJS**: Vue.js Three.js integration

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m "Add feature description"`
5. Push to the branch: `git push origin feature-name`
6. Open a pull request

## License

This project is licensed under the ISC License - see the package.json file for details.

## Future Enhancements

- [ ] Add more Camino routes and stages
- [ ] Implement user preferences and saved routes
- [ ] Add weather integration
- [ ] Include accommodation recommendations
- [ ] Mobile app development
- [ ] Real-time route tracking
- [ ] Community features and reviews
