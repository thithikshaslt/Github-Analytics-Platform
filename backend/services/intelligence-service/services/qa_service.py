import re
import logging
from typing import Dict, List, Tuple, Any
from services import llm


logger = logging.getLogger(__name__)


STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "if", "because", "as", "what",
    "which", "this", "that", "these", "those", "then", "just", "so", "than",
    "such", "both", "through", "about", "for", "is", "of", "while", "during",
    "to", "from", "in", "out", "on", "off", "again", "further", "then",
    "once", "here", "there", "when", "where", "why", "how", "all", "any",
    "both", "each", "few", "more", "most", "other", "some", "such", "no",
    "nor", "not", "only", "own", "same", "so", "than", "too", "very", "can",
    "will", "just", "don", "should", "now", "does", "do", "did", "have", "has"
}


def extract_keywords(query: str) -> List[str]:
    words = re.findall(r'\b[a-zA-Z0-9_-]{2,}\b', query.lower())
    return [w for w in words if w not in STOPWORDS]


def rank_relevant_files(files: Dict[str, str], query: str, top_k: int = 4) -> List[Tuple[str, str]]:
    keywords = extract_keywords(query)
    if not keywords:
        # Return first few files if query has no specific keywords
        return [(k, files[k]) for k in list(files.keys())[:top_k]]


    scored_files = []
    for path, content in files.items():
        score = 0
        path_lower = path.lower()
        content_lower = content.lower()


        for kw in keywords:
  # Matches in filename/path carry heavy weight
            if kw in path_lower:
                score += 10
            # Occurrences in content
            count = content_lower.count(kw)
            score += min(count, 5)


        if score > 0:
            scored_files.append((score, path, content))


    # Sort descending by score
    scored_files.sort(key=lambda x: x[0], reverse=True)
    return [(path, content) for _, path, content in scored_files[:top_k]]


async def answer_question(repo_files: Dict[str, str], question: str) -> Dict[str, Any]:
    relevant = rank_relevant_files(repo_files, question, top_k=4)
    relevant_paths = [p for p, _ in relevant]


    snippets = []
    total_len = 0
    for path, content in relevant:
        snip = f"--- File: {path} ---\n{content}\n"
        if total_len + len(snip) > 14000:
            remaining = 14000 - total_len
            if remaining > 200:
                snippets.append(snip[:remaining] + "\n... [truncated] ...\n")
            break
        snippets.append(snip)
        total_len += len(snip)


    context = "\n".join(snippets)


    system_prompt = (
        "You are an expert codebase assistant. Answer the user's question directly, accurately, "
        "and clearly using the provided source code context. Reference specific file names, "
       "function names, or line logic where appropriate. If the context does not contain the answer, "
        "politely say so while sharing what you can infer."
    )


    prompt = f"""Source Code Context from repository:
{context}


User Question: {question}


Please provide a helpful, structured answer with code references if applicable:"""


    answer = await llm.generate(prompt, system_prompt)
    return {
        "answer": answer,
        "relevantFiles": relevant_paths
    }
