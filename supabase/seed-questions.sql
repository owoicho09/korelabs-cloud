-- KoreLabs Cloud — Quiz Questions Seed
-- 20 questions per role (8 fundamentals, 8 applied, 4 korelabs)
-- Points: fundamentals=1, applied=2, korelabs=3 → max 36

-- ────────────────────────────────────────────
-- SENIOR BACKEND ENGINEER
-- ────────────────────────────────────────────
insert into quiz_questions (job_slug, tier, question, options, correct_index, explanation, points, order_index) values

('senior-backend-engineer','fundamentals','What does the CAP theorem state about distributed systems?',
  ARRAY['A system can simultaneously guarantee consistency, availability, and partition tolerance','A system can guarantee at most two of: consistency, availability, and partition tolerance','Partition tolerance is optional in distributed systems','Consistency and availability are mutually exclusive in all cases'],
  1,'CAP theorem states you can only guarantee two of the three properties simultaneously. In the presence of a network partition, you must choose between consistency and availability.',1,1),

('senior-backend-engineer','fundamentals','In PostgreSQL, what is the purpose of a covering index?',
  ARRAY['To index every column in a table','To include non-key columns so a query can be satisfied from the index alone without accessing the heap','To create a unique constraint across multiple tables','To speed up full table scans'],
  1,'A covering index includes all columns needed by a query in the index itself (using INCLUDE), eliminating heap fetches and dramatically speeding up read-heavy queries.',1,2),

('senior-backend-engineer','fundamentals','Which HTTP status code should an API return when a resource is created successfully?',
  ARRAY['200 OK','201 Created','202 Accepted','204 No Content'],
  1,'201 Created indicates that the request was fulfilled and a new resource was created. The response body typically contains the created resource.',1,3),

('senior-backend-engineer','fundamentals','What is the difference between optimistic and pessimistic locking?',
  ARRAY['Optimistic locking prevents concurrent reads; pessimistic allows them','Optimistic locking checks for conflicts at commit time; pessimistic locks the resource upfront','Pessimistic locking is faster under high contention','They are equivalent in performance under all workloads'],
  1,'Optimistic locking assumes conflicts are rare and checks at commit time using version numbers or timestamps. Pessimistic locking prevents concurrent access by locking the resource immediately.',1,4),

('senior-backend-engineer','fundamentals','What is a message queue and why is it used in distributed systems?',
  ARRAY['A cache for API responses','A buffer that decouples producers from consumers, enabling async processing and resilience','A type of database index','A load balancer for HTTP traffic'],
  1,'Message queues decouple service dependencies, smooth out traffic spikes, and provide durability — if a consumer fails, messages remain in the queue and can be reprocessed.',1,5),

('senior-backend-engineer','fundamentals','What does idempotency mean in the context of API design?',
  ARRAY['An operation that completes in constant time','An operation that produces the same result regardless of how many times it is called','An operation that never fails','An operation that runs synchronously'],
  1,'Idempotency ensures that repeated requests produce the same outcome — critical for safe retries in distributed systems where network failures can cause duplicate requests.',1,6),

('senior-backend-engineer','fundamentals','Which isolation level in SQL prevents dirty reads but allows non-repeatable reads?',
  ARRAY['Read Uncommitted','Read Committed','Repeatable Read','Serializable'],
  1,'Read Committed prevents reading uncommitted data (dirty reads) but allows non-repeatable reads — where the same query can return different results within the same transaction.',1,7),

('senior-backend-engineer','fundamentals','What is the primary purpose of a circuit breaker pattern in microservices?',
  ARRAY['To encrypt traffic between services','To prevent cascading failures by failing fast when a dependency is unhealthy','To load balance requests across instances','To authenticate inter-service calls'],
  1,'Circuit breakers detect when a downstream service is failing and stop sending requests to it temporarily, preventing timeouts from cascading and exhausting resources across the system.',1,8),

('senior-backend-engineer','applied','You are designing an API endpoint that receives webhook events from Slack at potentially high volume. The processing for each event takes 2–5 seconds. What architecture would you choose?',
  ARRAY['Process events synchronously in the webhook handler, return 200 only when done','Accept the webhook, immediately enqueue the event, return 200, process asynchronously','Reject events with 429 when processing takes too long','Buffer events in application memory before processing'],
  1,'Slack and most webhook providers expect a fast 200 response. Processing synchronously risks timeouts and missed events. Enqueue immediately (SQS, Redis, etc.) and process asynchronously — this is the standard pattern.',2,9),

('senior-backend-engineer','applied','A background job that previously ran in 2 seconds now consistently takes 45 seconds after a schema migration added a new column. What is the most likely cause and how would you investigate?',
  ARRAY['The new column increased row size beyond the network MTU','An existing index became invalid or a query plan changed due to new statistics; check EXPLAIN ANALYZE output','The migration introduced a deadlock','The background job is now running on fewer CPU cores'],
  1,'Schema changes can invalidate query plans or statistics. EXPLAIN ANALYZE before/after reveals plan changes. A missing or changed index on the new or related column is the most common culprit.',2,10),

('senior-backend-engineer','applied','You need to implement rate limiting for a public API used by thousands of clients. Which approach scales best across multiple application instances?',
  ARRAY['Store request counts in application memory with a sliding window','Use Redis with atomic Lua scripts or the token bucket algorithm to maintain shared state','Rate limit only at the reverse proxy layer without application awareness','Use a database table to track request counts per client'],
  1,'Application-level memory does not share state across instances. Database rate limiting creates excessive write contention. Redis with atomic operations (Lua or INCR + EXPIRE) provides distributed, low-latency rate limiting.',2,11),

('senior-backend-engineer','applied','A service that aggregates data from five external APIs has a p99 latency of 800ms. Three of the five calls are independent. What is the most impactful optimisation?',
  ARRAY['Cache all API responses for 24 hours','Run the three independent calls in parallel using goroutines or Promise.all','Move the aggregation logic to a background job','Increase the timeout for each external call'],
  1,'Parallelising independent calls reduces total latency to max(parallel call durations) rather than sum. If each independent call takes ~200ms, this alone can cut the critical path by 400ms.',2,12),

('senior-backend-engineer','applied','How would you design a system that needs to notify 50,000 users within 5 minutes of an event occurring?',
  ARRAY['Loop through all users in a single thread and send one by one','Partition users across multiple worker queues and process batches in parallel; use a fan-out pattern','Send a single broadcast HTTP request to all clients simultaneously','Use a cron job that checks for pending notifications every minute'],
  1,'Fan-out distributes work across parallel workers. Partitioning by user ID ensures even distribution. Combined with connection pooling to notification providers (email/push), this achieves the throughput needed.',2,13),

('senior-backend-engineer','applied','You are debugging a memory leak in a Go service. What is the most reliable approach?',
  ARRAY['Restart the service on a schedule to prevent OOM kills','Use pprof heap profiling before and after load to identify allocation hotspots','Increase the container memory limit','Disable the garbage collector temporarily to observe allocations'],
  1,'Go''s pprof provides heap, goroutine, and allocation profiles. Comparing heap profiles under load versus idle reveals which code paths are allocating and retaining memory.',2,14),

('senior-backend-engineer','applied','An e-commerce checkout creates an order, charges the card, and reserves inventory — three separate services. How do you handle partial failures?',
  ARRAY['Use a single database transaction across all three services','Implement the Saga pattern with compensating transactions for each step','Ignore failures and rely on manual reconciliation','Use two-phase commit across all three services'],
  1,'Sagas handle distributed transactions without two-phase commit. Each step has a compensating action (refund charge, release reservation). Choreography or orchestration-based Sagas are both valid depending on complexity.',2,15),

('senior-backend-engineer','applied','What is the key trade-off when choosing between event sourcing and traditional CRUD for a business-critical data model?',
  ARRAY['Event sourcing is always faster; CRUD is simpler','Event sourcing preserves complete history and enables temporal queries at the cost of query complexity; CRUD is simpler but loses history','CRUD supports higher write throughput in all cases','Event sourcing cannot be used with relational databases'],
  1,'Event sourcing''s append-only log is invaluable for audit, replay, and temporal queries. The cost is query complexity (you must project state from events) and storage growth over time.',2,16),

('senior-backend-engineer','korelabs','KoreOS ingests events from multiple integration points (Slack, Jira, Notion) for each customer. How would you architect the data isolation layer to ensure one customer''s data never affects another''s processing?',
  ARRAY['Use a single shared database with customer_id filters on all queries','Partition events by customer at the queue level; use separate processing contexts per customer; enforce tenant isolation at the data layer with row-level security','Encrypt all data and share processing infrastructure freely','Run completely separate infrastructure stacks per customer'],
  1,'Queue-level partitioning ensures processing isolation. RLS in PostgreSQL enforces data isolation even if application code has bugs. Separate processing contexts prevent one customer''s heavy load from affecting others.',3,17),

('senior-backend-engineer','korelabs','The KoreOS intelligence engine needs to detect "coordination waste" — signals that a task is blocked or that a meeting could have been an async message. Describe the backend data model you would design to represent these signals.',
  ARRAY['A simple events table with a "waste_detected" boolean column','A hierarchical model: raw_events → derived_signals → coordination_patterns → waste_detections, with confidence scores and source attribution at each level','A single JSON blob per organisation updated in real time','A relational model mirroring the structure of each integration (Slack tables, Jira tables, etc.)'],
  1,'Intelligence requires traceability. Layered models allow the system to explain its conclusions, retrain on corrections, and debug false positives. Confidence scores enable thresholding and progressive disclosure.',3,18),

('senior-backend-engineer','korelabs','KoreOS needs to run a cron pipeline that processes scheduled jobs (send emails, move pipeline stages) every 15 minutes. What would you use to ensure jobs are processed exactly once, even across multiple application instances?',
  ARRAY['Use a distributed lock in Redis with TTL before processing each job','Use database-level locking: UPDATE pipeline_jobs SET processing_at=now() WHERE id=? AND processed_at IS NULL RETURNING * — this atomically claims a job','Use a simple cron lock file on each server','Process all jobs on a single dedicated instance to avoid concurrency'],
  1,'The SELECT...UPDATE...RETURNING pattern atomically claims jobs without external dependencies. Add a processing_at column and a stuck-job recovery mechanism (reset jobs processing for >5min). This is robust and simple.',3,19),

('senior-backend-engineer','korelabs','A large enterprise customer (500 employees, 10+ integrations) generates 50x the event volume of an average customer. How would you prevent this from degrading performance for other customers?',
  ARRAY['Rate limit the customer''s event ingestion to match average volume','Use per-customer rate limiting at ingestion, priority queues for processing, and autoscaling worker groups that can handle burst traffic without blocking the shared pool','Add more infrastructure globally to handle the increased load','Ask the customer to reduce their event volume'],
  1,'Per-customer queue partitioning is the foundation. Priority queuing ensures small customers are not starved by large ones. Autoscaling handles bursts. This is the multi-tenancy isolation problem at the infrastructure level.',3,20);

-- ────────────────────────────────────────────
-- SENIOR FRONTEND ENGINEER
-- ────────────────────────────────────────────
insert into quiz_questions (job_slug, tier, question, options, correct_index, explanation, points, order_index) values

('senior-frontend-engineer','fundamentals','What is the purpose of the React key prop when rendering lists?',
  ARRAY['To apply CSS styles to list items','To help React identify which items have changed, been added, or removed during reconciliation','To enforce unique IDs in the DOM','To bind event handlers to list items'],
  1,'Keys help React''s reconciliation algorithm match previous tree elements with new ones efficiently. Using stable, unique keys (like IDs) prevents unnecessary re-renders and avoids state bugs.',1,1),

('senior-frontend-engineer','fundamentals','What is the difference between useMemo and useCallback in React?',
  ARRAY['They are identical; the names are aliases','useMemo memoizes a computed value; useCallback memoizes a function reference — preventing re-creation on each render','useCallback is faster than useMemo in all cases','useMemo is for class components; useCallback is for function components'],
  1,'useMemo returns a memoized value (result of a computation). useCallback returns a memoized function. Both prevent unnecessary re-computation or re-creation when dependencies have not changed.',1,2),

('senior-frontend-engineer','fundamentals','What does TypeScript''s "strict" mode enable that is not on by default?',
  ARRAY['Stricter CSS class checking','A set of checks including strictNullChecks, noImplicitAny, and strictFunctionTypes that catch common type errors at compile time','Slower compilation for better error messages','Runtime type checking'],
  1,'Strict mode bundles several useful checks: strictNullChecks (catches null/undefined misuse), noImplicitAny (requires explicit types), and others that prevent entire classes of runtime errors.',1,3),

('senior-frontend-engineer','fundamentals','What is the browser''s critical rendering path and why does it matter for performance?',
  ARRAY['The path JavaScript takes to reach the server','The sequence of steps (parse HTML → build DOM → build CSSOM → render tree → layout → paint) that determines when users see content','The network route a CDN uses to serve assets','The order in which React renders components'],
  1,'Understanding the critical path reveals why render-blocking resources (large CSS, synchronous JS) delay first paint. Optimising it — by deferring scripts, inlining critical CSS — directly improves perceived load time.',1,4),

('senior-frontend-engineer','fundamentals','What is CSS specificity and how is it calculated?',
  ARRAY['The order in which CSS rules are declared in the file','A weight assigned to selectors: inline styles > IDs > classes/attributes > elements, used to resolve conflicting rules','Whether a CSS property uses !important','The number of CSS files imported on a page'],
  1,'Specificity resolves conflicts between CSS rules. Calculated as (inline, ID count, class/attribute count, element count). Higher specificity wins; equal specificity uses source order.',1,5),

('senior-frontend-engineer','fundamentals','In a browser, what is the difference between localStorage and sessionStorage?',
  ARRAY['localStorage is encrypted; sessionStorage is not','localStorage persists across browser sessions; sessionStorage is cleared when the tab or window is closed','sessionStorage has a larger storage limit','They are identical except for the API method names'],
  1,'localStorage persists indefinitely (or until explicitly cleared). sessionStorage is scoped to the browser tab session and clears when the tab closes. Both are synchronous and not suitable for large data.',1,6),

('senior-frontend-engineer','fundamentals','What does "code splitting" accomplish in a JavaScript application?',
  ARRAY['Reduces the number of JavaScript files from many to one','Splits large JavaScript bundles into smaller chunks loaded on demand, reducing initial load time','Removes duplicate code across modules','Compresses JavaScript with gzip'],
  1,'Code splitting (via dynamic import() or React.lazy) defers loading code until it is needed. This reduces the initial bundle size and the time before a page is interactive.',1,7),

('senior-frontend-engineer','fundamentals','What is the purpose of the useEffect cleanup function?',
  ARRAY['To remove CSS classes when a component unmounts','To cancel subscriptions, clear timers, or abort requests when a component unmounts or before the effect re-runs, preventing memory leaks and stale closures','To call setState one final time before unmount','To log component lifecycle events'],
  1,'The cleanup function returned from useEffect runs before the next effect execution and on unmount. Without it, subscriptions and intervals continue running after the component is gone, causing memory leaks and bugs.',1,8),

('senior-frontend-engineer','applied','A React component re-renders 60 times per second even when the user is not interacting with it. How do you diagnose and fix this?',
  ARRAY['Wrap the component in React.memo without further investigation','Use React DevTools Profiler to identify what is triggering renders; likely a referentially unstable object or function being passed as a prop or used as a useEffect dependency','Add a shouldComponentUpdate lifecycle method','Increase the debounce delay on all event handlers'],
  1,'React DevTools Profiler shows exactly why each render occurred. Unstable references (new object/array/function each render) are the most common cause. Fix with useMemo, useCallback, or moving values outside the component.',2,9),

('senior-frontend-engineer','applied','You are building a large data table that renders 10,000 rows. The page becomes unresponsive after loading. What is the correct solution?',
  ARRAY['Paginate server-side and load 20 rows at a time','Implement windowing/virtualisation using a library like react-virtual — only render rows visible in the viewport','Use CSS to hide non-visible rows with display:none','Move the data processing to a Web Worker'],
  1,'Virtualisation renders only the visible rows plus a small buffer, maintaining constant DOM node count regardless of data size. This keeps the browser''s rendering budget manageable.',2,10),

('senior-frontend-engineer','applied','A multi-step form needs to persist state across steps without losing data on navigation. The form has complex validation logic. What approach works best?',
  ARRAY['Store all form state in URL query parameters','Use React Hook Form with a Zod schema per step, persisting to a shared form context or Zustand store; validate on step transitions rather than globally','Use local state in each step component and pass up via callbacks','Store in localStorage and rehydrate on each step mount'],
  1,'React Hook Form with a Zod resolver handles validation efficiently. Shared context or a state library bridges state between steps. Validating on step transitions gives immediate feedback without blocking forward progress.',2,11),

('senior-frontend-engineer','applied','Your application fetches data from an API that occasionally takes 3–5 seconds. Users see a blank screen during loading. How would you improve the perceived experience?',
  ARRAY['Show a loading spinner and disable all interactivity','Show skeleton screens matching the layout of the loaded content, enable partial interactivity where possible, and use optimistic updates for mutations','Prefetch all possible data on app load','Increase the API timeout and wait longer before showing anything'],
  1,'Skeleton screens set user expectations about the content shape and feel faster than spinners. Optimistic updates (assume success, roll back on error) make mutations feel instant.',2,12),

('senior-frontend-engineer','applied','How would you implement a real-time dashboard that shows live updates from a backend without polling every second?',
  ARRAY['Poll the API every 100ms for the freshest data','Use WebSockets or Server-Sent Events to receive push updates; fall back to long polling if WebSockets are unavailable','Reload the page on a 30-second interval','Cache API responses aggressively and mark them stale after 1 second'],
  1,'SSE is simpler than WebSockets for one-directional server-to-client updates and works over HTTP/2. WebSockets are better for bidirectional communication. Both avoid the overhead and latency of polling.',2,13),

('senior-frontend-engineer','applied','What is the impact of rendering a large SVG icon library as inline SVG versus a sprite sheet versus individual <img> tags?',
  ARRAY['They are equivalent; the browser optimises all approaches equally','Inline SVGs are stylable but increase HTML size and parsing time; sprites reduce requests; img tags are cached well but not stylable with CSS — the right choice depends on your use case','Inline SVG is always the worst approach','Sprite sheets are deprecated in modern browsers'],
  1,'Inline SVG allows CSS styling and animation but bloats HTML. Sprites (or SVG use/symbol) reduce HTTP requests. Img tags cache efficiently but lose CSS control. Icon component libraries like Lucide inline SVG per icon.',2,14),

('senior-frontend-engineer','applied','You need to implement drag-and-drop between columns on a Kanban board. What are the key accessibility considerations?',
  ARRAY['Accessibility is not required for drag-and-drop interfaces','Provide keyboard alternatives (arrow keys to move cards between columns), ARIA live regions to announce moves, visible focus states, and ensure the drag action does not require precise mouse control','Add a text description of the drag-and-drop interaction in the page footer','Use HTML5 native drag-and-drop API which handles accessibility automatically'],
  1,'Drag-and-drop must have keyboard equivalents. ARIA live regions announce state changes to screen readers. Libraries like @hello-pangea/dnd provide accessible implementations out of the box.',2,15),

('senior-frontend-engineer','applied','A user reports that clicking "Save" sometimes saves their changes and sometimes does not. Logs show the API call succeeds each time. What is the most likely cause?',
  ARRAY['A server-side caching issue','A race condition: a second click or an effect re-run triggers a conflicting state update, overwriting the saved state; disable the button after the first click and handle async state carefully','A browser rendering bug','The API endpoint is non-deterministic'],
  1,'Race conditions in async UI are common. The fix: disable the button optimistically, track inflight request state, and reconcile with server state on response. useReducer often helps model these transitions clearly.',2,16),

('senior-frontend-engineer','korelabs','KoreOS needs a dashboard widget that shows how much coordination overhead a team is experiencing this week, with a comparison to last week. Design the component interface (props) and describe how you would make it accessible.',
  ARRAY['Pass raw data and let the component do all calculations; do not worry about accessibility','Accept pre-computed values (thisWeek, lastWeek, delta, trend) as props; use a semantic heading, aria-label on the comparison value describing the change in plain language, and a role="img" with alt text on any chart','Use a table for the data and skip ARIA','Expose only a loading state prop and fetch data inside the component'],
  1,'Pre-computed props keep components pure and testable. Semantic HTML and ARIA ensure screen readers can communicate the insight. Charts need accessible text alternatives — the visual alone does not convey meaning.',3,17),

('senior-frontend-engineer','korelabs','You are building a Slack integration surface (App Home tab) for KoreOS. What are the key constraints and how do they affect your frontend architecture?',
  ARRAY['Slack App Home is rendered as a React app inside Slack''s webview','Slack App Home uses Block Kit — a JSON-based layout system, not HTML/CSS; the UI must be defined as Block Kit payloads sent via the API, not as traditional frontend components','You can embed arbitrary HTML in Slack App Home','Slack App Home supports WebSockets for real-time updates directly'],
  1,'Block Kit is Slack''s structured UI framework. This means your "frontend" for Slack surfaces is really a data serialisation problem — composing Block Kit JSON correctly — rather than DOM manipulation.',3,18),

('senior-frontend-engineer','korelabs','KoreOS displays AI-generated insights to enterprise users. Some insights will be wrong occasionally. How should the UI communicate uncertainty and allow users to provide feedback?',
  ARRAY['Only show insights when confidence is above 99%','Show confidence indicators (low/medium/high) with plain language, provide a one-click "This is wrong" feedback mechanism, log corrections to improve the model, and explain the basis for each insight on demand','Hide the AI nature of insights to avoid user skepticism','Show raw probability scores (0.73, 0.91, etc.) for full transparency'],
  1,'Enterprise users need to trust AI-assisted tools. Confidence indicators calibrate expectations. Feedback loops improve the model. Explainability ("why KoreOS flagged this") is essential for trust in high-stakes environments.',3,19),

('senior-frontend-engineer','korelabs','The KoreOS interface needs to support keyboard-first power users (e.g. ops leads who live in their keyboard) without degrading the mouse experience. What patterns would you implement?',
  ARRAY['Add tabindex to every element and call it done','Implement a command palette (Cmd+K), logical tab order following visual layout, keyboard shortcuts for frequent actions with a visible shortcut reference, and ensure all interactive elements have visible focus states that meet WCAG 2.1 AA','Focus management is handled automatically by the browser','Keyboard navigation is only required for government websites'],
  1,'Command palettes (pioneered by Linear, VS Code) dramatically improve keyboard-first workflows. Visible focus states are legally required in many European jurisdictions under EN 301 549. Logical tab order prevents keyboard traps.',3,20);

-- ────────────────────────────────────────────
-- AI/ML ENGINEER
-- ────────────────────────────────────────────
insert into quiz_questions (job_slug, tier, question, options, correct_index, explanation, points, order_index) values

('ai-ml-engineer','fundamentals','What is the bias-variance tradeoff in machine learning?',
  ARRAY['High bias means the model is overfitting; high variance means underfitting','High bias means the model is too simple and underfits; high variance means the model is too complex and overfits the training data','Bias and variance are independent properties','The tradeoff only applies to neural networks'],
  1,'High bias = underfitting (model too simple, misses patterns). High variance = overfitting (model memorises training data, fails to generalise). The goal is minimising total error = bias² + variance + irreducible noise.',1,1),

('ai-ml-engineer','fundamentals','What is the purpose of a validation set in model training?',
  ARRAY['To provide additional training data when the training set is small','To evaluate hyperparameter choices during training without contaminating the test set, which measures final generalisation','To store the best checkpoint of a model','To normalise the training data'],
  1,'Training set trains parameters. Validation set tunes hyperparameters and prevents overfitting to training data. Test set provides an unbiased estimate of final performance. Using the test set for tuning is data leakage.',1,2),

('ai-ml-engineer','fundamentals','What does BLEU score measure?',
  ARRAY['Classification accuracy on a benchmark','Overlap between a generated text and one or more reference texts, used to evaluate translation and text generation quality','The computational cost of an LLM inference','Semantic similarity using embeddings'],
  1,'BLEU (Bilingual Evaluation Understudy) measures n-gram precision between generated and reference text. It is fast to compute but imperfect — it does not capture semantic meaning. Often supplemented with ROUGE for summarisation.',1,3),

('ai-ml-engineer','fundamentals','What is the vanishing gradient problem and which architectural choices help address it?',
  ARRAY['Gradients that become too large, exploding through the network','Gradients that shrink exponentially as they propagate back through deep networks, making early layers learn slowly; addressed by residual connections, normalisation layers, and careful initialisation','A problem unique to convolutional networks','A hardware problem caused by floating-point underflow'],
  1,'As gradients flow backwards through many layers, sigmoid/tanh activations squash them. Solutions: ReLU activations, batch/layer normalisation, residual connections (ResNets), and gradient clipping.',1,4),

('ai-ml-engineer','fundamentals','What is the difference between precision and recall in a classification problem?',
  ARRAY['They are synonyms for accuracy','Precision = TP/(TP+FP) — of predicted positives, how many are actually positive. Recall = TP/(TP+FN) — of actual positives, how many did we catch','Precision measures recall at different thresholds','Recall is always higher than precision'],
  1,'Precision answers "are our positive predictions correct?" Recall answers "did we find all positives?" High precision, low recall = conservative model. Low precision, high recall = aggressive model. F1 score balances both.',1,5),

('ai-ml-engineer','fundamentals','What is a transformer''s attention mechanism and why is it effective for sequence tasks?',
  ARRAY['A recurrent mechanism that processes tokens one at a time','A mechanism that computes weighted relationships between all positions in a sequence simultaneously, allowing the model to capture long-range dependencies without sequential bottlenecks','A convolutional filter applied across sequence positions','A simple averaging of all token embeddings'],
  1,'Self-attention computes query-key-value relationships across all positions in parallel, with O(n²) complexity in sequence length. This enables efficient capture of long-range dependencies that recurrent models struggled with.',1,6),

('ai-ml-engineer','fundamentals','What is the purpose of temperature in LLM sampling?',
  ARRAY['A hardware throttling parameter for inference servers','A parameter that controls the randomness of token selection: lower temperature makes outputs more deterministic; higher temperature makes them more creative and diverse','A normalisation factor for embedding vectors','The ratio of training compute to inference compute'],
  1,'Temperature scales the logit distribution before softmax. T→0 approaches greedy decoding (always pick the highest probability token). T→1 samples from the true distribution. T>1 flattens the distribution, increasing diversity.',1,7),

('ai-ml-engineer','fundamentals','What is feature engineering and why does it still matter in the era of deep learning?',
  ARRAY['It refers to engineering software features, not model features','Transforming raw data into representations that make patterns more learnable; still important for tabular data, time series, and low-data settings where deep models overfit','It is completely obsolete since neural networks learn representations automatically','Feature engineering only applies to linear models'],
  1,'Deep learning reduces but does not eliminate the need for feature engineering. For structured/tabular data, domain-informed features often outperform raw inputs. For time series, lag features and aggregations remain valuable.',1,8),

('ai-ml-engineer','applied','You are building a model to detect when a task in Jira is "blocked" based on comment text, status transitions, and elapsed time. What type of model would you start with and why?',
  ARRAY['Start with a large neural network to capture all complexity immediately','Start with a gradient-boosted model (XGBoost/LightGBM) on hand-engineered features — faster to iterate, interpretable, establishes a strong baseline before adding complexity','Use a pre-trained LLM immediately with no feature engineering','Use a rule-based system only'],
  1,'Starting simple establishes a baseline and reveals which features matter. Gradient-boosted models handle tabular features well, are fast to train, and provide feature importance. Add neural/LLM components where they improve on the baseline.',2,9),

('ai-ml-engineer','applied','Your model achieves 92% accuracy on the test set, but in production it performs poorly. What would you investigate first?',
  ARRAY['Increase model complexity — the test accuracy was insufficiently high','Check for distribution shift: is the production data statistically different from your training/test data? Also check for data leakage in the test set and whether the test set is representative','Retrain with more regularisation','Check the hardware running the model'],
  1,'Distribution shift (train/test from one time period, production from another) is the most common cause. Data leakage causes inflated test metrics. Monitoring production feature distributions against training distributions is essential.',2,10),

('ai-ml-engineer','applied','How would you evaluate whether a prompt-engineered LLM pipeline for summarising Slack threads is working well enough to trust in production?',
  ARRAY['Calculate BLEU score against a reference set and deploy if it exceeds 0.7','Build a golden dataset of human-judged examples; measure precision/recall of key information captured; A/B test with users; monitor for hallucinations and information omission at scale','Use the LLM to evaluate its own outputs','Deploy immediately and rely on user feedback'],
  1,'LLM evaluation requires human judgement baselines. Automated metrics alone are insufficient for open-ended generation. A/B testing provides real-world signal. Hallucination detection (factual consistency checks) is critical for trust.',2,11),

('ai-ml-engineer','applied','Your inference pipeline needs to serve predictions with <100ms p95 latency. The model is a fine-tuned BERT variant with 110M parameters. What strategies would you apply?',
  ARRAY['Accept the high latency — model quality is more important','Apply quantisation (INT8 or FP16), model distillation to a smaller architecture, TorchScript compilation, and batching of concurrent requests; measure each change''s latency/accuracy tradeoff','Scale horizontally with more GPU instances','Remove all model layers beyond the first 3'],
  1,'INT8 quantisation typically reduces latency 2-4x with minimal accuracy loss. Distillation into a smaller model (DistilBERT) is another option. Dynamic batching amortises overhead. Profile first to find the actual bottleneck.',2,12),

('ai-ml-engineer','applied','You are fine-tuning an LLM on proprietary data from KoreLabs customers. What are the most important privacy and security considerations?',
  ARRAY['Fine-tuning on customer data is always safe as long as it is anonymised','Ensure data cannot be extracted via model inversion; use differential privacy during fine-tuning; implement strict data isolation between customer tenants; understand what the model has "memorised"; maintain data processing agreements','Encrypt the model weights after training','Use only synthetic data'],
  1,'LLMs can memorise and reproduce training data. Differential privacy provides formal guarantees. Cross-tenant contamination is a serious risk. Data processing agreements are legally required under GDPR for customer data.',2,13),

('ai-ml-engineer','applied','A classification model has 95% accuracy but performs poorly on one important class. What is likely happening and how would you address it?',
  ARRAY['The model is fine; 95% accuracy is excellent','Class imbalance: the model has learned to ignore the minority class because the majority class dominates accuracy; address with oversampling (SMOTE), class weights, or threshold adjustment; use F1 or AUC-PR as the primary metric','The model needs more hidden layers','Increase the learning rate'],
  1,'Imbalanced datasets cause misleading accuracy. A model that always predicts the majority class can achieve 95% on a 95/5 split. Use stratified sampling, class weights in the loss function, and precision-recall curves to evaluate.',2,14),

('ai-ml-engineer','applied','How would you structure an ML experiment tracking system to ensure reproducibility and enable comparison across runs?',
  ARRAY['Save only the final model weights','Log hyperparameters, dataset versions (hash or version), random seeds, environment dependencies, evaluation metrics per epoch, and artifact paths using a platform like MLflow or Weights & Biases','Use consistent file naming conventions','Run experiments on the same hardware every time'],
  1,'Reproducibility requires tracking everything that affects outputs: code version, data version, hyperparameters, seeds, and environment. Tools like MLflow or W&B automate this and enable visual comparison across experiments.',2,15),

('ai-ml-engineer','applied','What is RAG (Retrieval-Augmented Generation) and when would you choose it over fine-tuning an LLM?',
  ARRAY['RAG is a type of fine-tuning that uses retrieval during training','RAG retrieves relevant documents at inference time and appends them to the prompt; prefer RAG when knowledge changes frequently or is too large to fine-tune into weights; prefer fine-tuning for style/behaviour changes','They are equivalent approaches','Fine-tuning is always better than RAG'],
  1,'RAG is better for dynamic, large, or frequently-updated knowledge bases. Fine-tuning encodes knowledge in weights — cheaper at inference but requires retraining as knowledge changes. Many production systems combine both.',2,16),

('ai-ml-engineer','korelabs','KoreOS needs to identify whether a meeting was necessary or could have been an async message. Given access to calendar event metadata, attendee lists, and post-meeting Slack messages, design an approach.',
  ARRAY['Use a simple keyword filter for words like "sync" or "standup"','Combine structured features (duration, attendee count, recurrence, outcome document created Y/N) with NLP on post-meeting messages (decision made? action items assigned?); train on labelled historical examples and validate with user feedback','Use only the meeting title to classify','Ask all users to manually label every meeting'],
  1,'Meeting necessity involves multiple signals. Structured features are fast and interpretable. NLP captures outcomes. Human-in-the-loop labelling of ambiguous cases improves the training set. Confidence thresholds determine when to surface insights.',3,17),

('ai-ml-engineer','korelabs','KoreOS learns organisation-specific patterns to improve its coordination waste detection over time. How would you architect the learning system to handle per-customer model personalisation without running 500 separate training pipelines?',
  ARRAY['Train one global model and apply it to all customers without personalisation','Use a shared base model fine-tuned with customer-specific adapter layers (LoRA or similar); federated learning for privacy-preserving personalisation; or hierarchical models with shared and customer-specific components — balance privacy, compute, and accuracy','Run a completely separate model per customer','Use customer_id as a feature in a single global model'],
  1,'Multi-task learning with customer-specific adapters is computationally efficient. Federated learning keeps raw data at the customer. Hierarchical Bayesian models balance global patterns with customer-specific deviations. The right choice depends on data volume per customer.',3,18),

('ai-ml-engineer','korelabs','An enterprise customer reports that KoreOS is incorrectly flagging important strategic meetings as "coordination waste." How would you handle this in both the short term and long term?',
  ARRAY['Tell the customer the model is correct and they should trust it','Short term: add a customer-managed exclusion list (specific recurring meetings, organiser overrides). Long term: incorporate explicit negative feedback as training signal; add a "meeting importance" feature from calendar metadata; consider a separate classifier for strategic meetings','Retrain the global model immediately with this customer''s corrections','Disable the meeting classification feature globally'],
  1,'Graceful degradation through exclusions provides immediate relief without retraining. Structured feedback loops improve the model without requiring full retraining. Strategic meeting detection may warrant a specialised classifier trained on outcome signals.',3,19),

('ai-ml-engineer','korelabs','KoreLabs needs to measure whether KoreOS is actually reducing coordination overhead by 30-40% for a customer. Design the measurement methodology.',
  ARRAY['Ask customers if they feel more productive','Establish baseline metrics before deployment (meeting hours/week, message response times, task cycle times, cross-tool context-switching events); measure the same metrics after 90 days; use a quasi-experimental design with control groups where possible; account for confounders (headcount changes, product launches)','Measure only the features KoreOS uses and report improvements in those metrics','Use a single survey question after 90 days'],
  1,'Causal attribution requires baselines, control conditions, and accounting for confounders. Hard metrics (meeting hours, cycle times) are more credible than self-reported productivity. Statistical significance matters at small customer sample sizes.',3,20);

-- ────────────────────────────────────────────
-- CYBERSECURITY ENGINEER
-- ────────────────────────────────────────────
insert into quiz_questions (job_slug, tier, question, options, correct_index, explanation, points, order_index) values

('cybersecurity-engineer','fundamentals','What is the difference between authentication and authorisation?',
  ARRAY['They are synonyms for the process of granting access','Authentication verifies who you are (identity); authorisation determines what you are allowed to do (permissions)','Authentication is for machines; authorisation is for humans','Authorisation always precedes authentication'],
  1,'Authentication = "are you who you claim to be?" (passwords, MFA, certificates). Authorisation = "are you allowed to do this?" (RBAC, ACLs, policies). Confusing them leads to serious access control vulnerabilities.',1,1),

('cybersecurity-engineer','fundamentals','What is SQL injection and how is it prevented?',
  ARRAY['Injecting SQL performance hints into queries','An attack where malicious SQL is inserted into user input to manipulate database queries; prevented by parameterised queries/prepared statements — never by input sanitisation alone','An attack that only works on MySQL databases','Prevented by rate limiting the login endpoint'],
  1,'SQL injection manipulates query logic by breaking out of string contexts. Parameterised queries separate SQL from data structurally, making injection impossible. Input sanitisation is insufficient because escape logic can be bypassed.',1,2),

('cybersecurity-engineer','fundamentals','What does TLS provide and what does it not provide?',
  ARRAY['TLS provides end-to-end encryption between the user and the database','TLS provides confidentiality and integrity between two parties and authenticates the server; it does not protect data once it reaches the server, does not prevent a compromised server from reading data, and does not provide non-repudiation by default','TLS guarantees the server cannot be compromised','TLS provides the same protection as end-to-end encryption'],
  1,'TLS protects data in transit. Once the server decrypts it, TLS''s protection ends. A compromised server can read all plaintext. End-to-end encryption (where the server never has the plaintext key) is a different, stronger model.',1,3),

('cybersecurity-engineer','fundamentals','What is CSRF and how do modern frameworks prevent it?',
  ARRAY['A type of injection attack on database queries','Cross-Site Request Forgery: tricks a victim into submitting a request to a site they are authenticated with; prevented by CSRF tokens, SameSite cookie attributes, and checking Origin/Referer headers','A form of man-in-the-middle attack','Prevented by HTTPS alone'],
  1,'CSRF exploits the browser''s automatic cookie inclusion. SameSite=Strict/Lax prevents the browser from sending cookies with cross-site requests. CSRF tokens require the attacker to know a secret value they cannot read.',1,4),

('cybersecurity-engineer','fundamentals','What is the principle of least privilege?',
  ARRAY['Users should have the minimum password length required','Every component, user, or process should have only the minimum access rights needed to perform its function — no more','Privileges should be distributed equally across all users','Admin privileges should be least used'],
  1,'Least privilege limits the blast radius of compromises. A compromised service account with minimal permissions causes less damage than one with broad access. Apply at every layer: OS, database, API, cloud IAM.',1,5),

('cybersecurity-engineer','fundamentals','What is the difference between symmetric and asymmetric encryption?',
  ARRAY['Symmetric is slower; asymmetric is faster','Symmetric encryption uses the same key to encrypt and decrypt (fast, good for bulk data); asymmetric uses a public/private key pair (slower, used for key exchange and signatures)','They provide different levels of encryption strength','Asymmetric encryption is only used for passwords'],
  1,'TLS uses asymmetric encryption to exchange a session key, then symmetric encryption for the rest of the session — combining the security properties of asymmetric with the performance of symmetric.',1,6),

('cybersecurity-engineer','fundamentals','What is a timing attack and which operations are most vulnerable?',
  ARRAY['An attack based on exploiting maintenance windows','An attack that infers secret information from the time taken to complete operations; password comparison, cryptographic operations, and secret key lookups are vulnerable if not implemented in constant time','An attack that exploits server timezone misconfigurations','Only relevant to hardware-level attacks'],
  1,'Non-constant-time comparison of secrets (e.g., string equality returning early on first mismatch) leaks information about the secret via timing differences. Always use constant-time comparison functions for secrets.',1,7),

('cybersecurity-engineer','fundamentals','What are the key GDPR obligations for a SaaS company handling EU personal data?',
  ARRAY['GDPR only applies to companies based in the EU','Lawful basis for processing, data subject rights (access, erasure, portability), breach notification within 72 hours, data minimisation, purpose limitation, DPAs with processors, and privacy by design','GDPR only covers healthcare data','Encryption alone satisfies all GDPR requirements'],
  1,'GDPR has broad extraterritorial scope — it applies to any company processing EU residents'' data. Key obligations include lawful basis (consent or legitimate interest), DPAs with vendors, breach notifications, and honouring data subject requests.',1,8),

('cybersecurity-engineer','applied','KoreOS requires OAuth tokens from customers'' Slack workspaces. These tokens can read all messages in connected channels. How would you secure their storage and use?',
  ARRAY['Store tokens in plaintext in the database for easy access','Encrypt tokens at rest using AES-256 with a key stored in a secrets manager (AWS KMS); transmit only over TLS; rotate access tokens before expiry; log all usage with anomaly detection; never log the token values themselves','Store tokens in environment variables per customer','Hash tokens like passwords'],
  1,'OAuth tokens are credentials and require equivalent protection. KMS-managed encryption separates the encryption key from the data. Usage logging enables detection of compromised tokens. Token rotation limits exposure windows.',2,9),

('cybersecurity-engineer','applied','A penetration test reveals that your API returns detailed error messages including stack traces and database schema information when queries fail. How do you fix this and what does it indicate about your security culture?',
  ARRAY['Add a disclaimer to the error messages warning that they are for debugging only','Implement a global error handler that logs full details server-side but returns generic messages to clients; treat this as a symptom of security not being considered in development — address with secure coding training and code review checklists','Only show detailed errors to authenticated users','Encrypt the error messages before returning them'],
  1,'Information disclosure assists attackers in understanding system internals. Centralised error handling ensures consistency. The deeper issue is that security was not part of the development process — fix the root cause, not just the symptom.',2,10),

('cybersecurity-engineer','applied','You discover that a former employee''s service account credentials are still active in your production environment. What is your immediate response?',
  ARRAY['Send the former employee a warning email','Immediately revoke the credentials; audit all access logs for the account since the employee''s last day; rotate any secrets or API keys the account had access to; file an incident report; review offboarding procedures to prevent recurrence','Wait until the next security review cycle','Change only the password, not the API keys'],
  1,'Revoke first, investigate second. Every day of continued access is a risk. Log analysis determines if the credentials were used post-departure. A formal incident report documents the timeline even if no harm occurred.',2,11),

('cybersecurity-engineer','applied','How would you assess the security of a third-party npm package before adding it to the codebase?',
  ARRAY['If it has >1000 stars on GitHub, it is safe to use','Check: maintainer reputation and history, last update date, open CVEs (npm audit, Snyk), download count trends (sudden spikes indicate potential compromise), whether you actually need the whole package or can implement the function yourself','Run the package in a sandbox first to observe its behaviour','Only use packages published by companies you have heard of'],
  1,'Supply chain attacks via npm are documented and serious (event-stream, ua-parser-js). Evaluate maintainer trust, CVE history, dependency count, and whether the functionality justifies the dependency. Pin versions and monitor for updates.',2,12),

('cybersecurity-engineer','applied','What security architecture would you recommend for KoreLabs'' admin dashboard that handles sensitive applicant data including CVs?',
  ARRAY['Password protection is sufficient; no additional controls needed','Implement: MFA for all admin accounts; IP allowlisting or VPN requirement; HttpOnly/Secure/SameSite cookies; short session expiry with activity timeout; detailed audit logging; rate limiting on login; principle of least privilege for admin roles','Use a strong password policy alone','Make the admin dashboard only accessible during business hours'],
  1,'Sensitive data requires layered controls. MFA prevents credential-only attacks. Network controls reduce exposure. Audit logs are essential for detecting misuse. Short sessions limit the damage from session theft.',2,13),

('cybersecurity-engineer','applied','How would you design a responsible vulnerability disclosure programme for KoreLabs?',
  ARRAY['Only accept vulnerability reports from paid security researchers','Publish a security.txt / security page with a dedicated email and PGP key; define clear scope, response SLAs (acknowledge in 24h, triage in 72h, fix critical in 30 days); commit to non-prosecution for good-faith research; consider a bug bounty programme; maintain a CVD policy aligned with EU cybersecurity regulations','Handle vulnerability reports the same as general support tickets','Ignore reports from external researchers'],
  1,'A clear VDP builds trust with researchers and customers. Response SLAs demonstrate commitment. Non-prosecution clauses are legally important for researchers. The EU NIS2 Directive is moving towards mandatory VDPs for important entities.',2,14),

('cybersecurity-engineer','applied','An employee''s laptop is stolen. It was encrypted with BitLocker and they used a strong login password. What is your incident response?',
  ARRAY['No action needed; the encryption protects everything','Remotely wipe the device if MDM allows; revoke all credentials the employee could access from that device (passwords stored in browser, API keys in local .env files, SSH keys); rotate shared secrets; file a police report; assess GDPR breach notification requirements','Recover the data from backup and continue normally','Only rotate the employee''s email password'],
  1,'Disk encryption protects offline access but not credentials cached in the browser or stored in plaintext files. Remote wipe prevents recovery of cached credentials. GDPR may require notifying supervisory authorities within 72 hours.',2,15),

('cybersecurity-engineer','applied','What is the difference between SAST and DAST in application security testing?',
  ARRAY['SAST tests the database; DAST tests the frontend','SAST (Static Application Security Testing) analyses source code without running it, finding vulnerabilities at development time; DAST (Dynamic Application Security Testing) tests the running application, finding vulnerabilities that only appear at runtime','They test different programming languages','SAST is manual; DAST is automated'],
  1,'SAST integrates into CI/CD pipelines and catches issues early and cheaply (taint analysis, pattern matching). DAST (Burp Suite, OWASP ZAP) finds runtime issues like authentication flaws that are invisible in code. Both are needed.',2,16),

('cybersecurity-engineer','korelabs','KoreOS processes messages from customer Slack workspaces containing potentially sensitive business information. Design a data handling architecture that satisfies GDPR and enterprise customer security requirements.',
  ARRAY['Store all message content in a single shared database with encryption at rest','Process messages in-memory where possible without persisting content; store only derived signals (coordination patterns, not message text); implement strict retention policies; customer data never leaves EU infrastructure; provide customers with data processing agreements and a data deletion API; conduct annual security audits','Encrypt all stored messages and consider GDPR satisfied','Let each customer manage their own data storage'],
  1,'Data minimisation (store signals, not raw messages) reduces risk and GDPR exposure. EU data residency is often a hard requirement for European enterprise customers. DPAs are legally required when processing personal data on behalf of customers.',3,17),

('cybersecurity-engineer','korelabs','A customer reports that their KoreOS integration is sending information to unexpected endpoints. How do you respond and investigate?',
  ARRAY['Ask the customer for more details and respond in 48 hours','Treat as a potential security incident immediately: isolate the affected customer''s integration; preserve logs; investigate network egress from the KoreOS processing environment; check for supply chain compromise or insider threat; notify the customer within hours; assess GDPR breach notification requirements; engage your incident response plan','Reassure the customer it is probably a false positive','Restart the customer''s integration services'],
  1,'Unexpected data egress is a serious incident requiring immediate response. Log preservation prevents evidence loss. Early customer communication builds trust even when facts are unclear. GDPR breach notification has a 72-hour clock.',3,18),

('cybersecurity-engineer','korelabs','KoreLabs is preparing for enterprise sales in Germany. Customers are asking for ISO 27001 certification and penetration test reports. How would you prioritise the path to certification?',
  ARRAY['ISO 27001 is a marketing exercise; write the policies and get certified without substantive changes','Treat ISO 27001 as a framework to build actual security maturity: gap analysis → policy and control implementation → internal audit → external audit; prioritise controls that match your actual risk profile; use the preparation process to fix real gaps; penetration tests should be conducted by a reputable third party annually and results shared under NDA with qualified enterprise prospects','Outsource the entire certification process to a consulting firm','Begin with SOC 2 Type I and delay ISO 27001 indefinitely'],
  1,'ISO 27001 has genuine value when implemented seriously. German enterprise procurement often requires it as a gate. The gap analysis typically surfaces real security gaps worth fixing. Third-party pen tests are credible; self-attested security is not.',3,19),

('cybersecurity-engineer','korelabs','How would you architect KoreLabs'' secrets management as the company grows from 47 to 150 people across multiple services?',
  ARRAY['Store all secrets in a shared .env file in the repository','Use a secrets management platform (AWS Secrets Manager, HashiCorp Vault): centralised storage, automatic rotation, audit logs for all access, short-lived credentials for services (dynamic secrets), integration with CI/CD for deployment secrets, and elimination of all secrets from source code and environment variable files; implement break-glass procedures for emergencies','Use a password manager shared among engineers','Store secrets in encrypted S3 objects'],
  1,'As teams grow, secrets sprawl becomes a serious attack surface. Centralised management with audit logs detects misuse. Dynamic/short-lived credentials limit the damage from a compromise. Automated rotation eliminates stale credentials.',3,20);

-- ────────────────────────────────────────────
-- DEVOPS / INFRASTRUCTURE ENGINEER
-- ────────────────────────────────────────────
insert into quiz_questions (job_slug, tier, question, options, correct_index, explanation, points, order_index) values

('devops-infrastructure-engineer','fundamentals','What is the difference between horizontal and vertical scaling?',
  ARRAY['Horizontal scaling means upgrading server hardware; vertical means adding more servers','Horizontal scaling adds more instances of a service; vertical scaling increases the resources (CPU, RAM) of existing instances','They are equivalent in cost and effectiveness','Horizontal scaling is only possible in cloud environments'],
  1,'Horizontal scaling improves availability and throughput by distributing load. Vertical scaling is simpler but has hardware limits and creates a single point of failure. Most production systems combine both.',1,1),

('devops-infrastructure-engineer','fundamentals','What does Infrastructure as Code (IaC) solve and which tools implement it?',
  ARRAY['IaC automates application deployments only','IaC describes infrastructure in versioned, declarative configuration files, enabling reproducibility, review, and automation; tools include Terraform, Pulumi, AWS CDK, and CloudFormation','IaC is only used for on-premises infrastructure','IaC removes the need for cloud providers'],
  1,'IaC treats infrastructure like application code: version controlled, peer reviewed, tested, and automatically applied. This eliminates configuration drift, makes disaster recovery reliable, and enables consistent environments.',1,2),

('devops-infrastructure-engineer','fundamentals','What is a Kubernetes Pod and how does it relate to a container?',
  ARRAY['A Pod is identical to a Docker container','A Pod is the smallest deployable unit in Kubernetes; it wraps one or more containers that share network and storage, allowing tightly coupled processes to communicate via localhost','A Pod is a virtual machine that runs containers','Pods are used only for stateful applications'],
  1,'Pods co-locate containers that must communicate directly. A single-container Pod is the most common pattern. Multi-container Pods use the sidecar pattern (e.g., a log shipper alongside an application container).',1,3),

('devops-infrastructure-engineer','fundamentals','What is the purpose of a load balancer and how does it differ from a reverse proxy?',
  ARRAY['They are identical; the terms are interchangeable','A load balancer distributes traffic across multiple backend instances to improve availability and throughput; a reverse proxy forwards client requests to one or more backends and can add TLS, caching, and routing logic — load balancing is typically a feature of reverse proxies','Load balancers are only used at Layer 7','Reverse proxies replace load balancers in cloud environments'],
  1,'Reverse proxies (Nginx, Envoy, ALB) can perform load balancing, TLS termination, rate limiting, and routing. Load balancing is often discussed at Layer 4 (TCP) or Layer 7 (HTTP). In practice, modern reverse proxies do both.',1,4),

('devops-infrastructure-engineer','fundamentals','What is the purpose of a Kubernetes liveness probe versus a readiness probe?',
  ARRAY['They are the same; liveness is the deprecated name','Liveness probes determine if a container should be restarted (is it alive?); readiness probes determine if a container should receive traffic (is it ready to serve requests?)','Readiness probes restart failed containers','Liveness probes are only used for database pods'],
  1,'Liveness restarts hung or deadlocked containers. Readiness prevents traffic from reaching containers that are starting up or temporarily overloaded. Getting these right prevents rolling deployment issues.',1,5),

('devops-infrastructure-engineer','fundamentals','What is a rolling deployment and what problem does it solve?',
  ARRAY['Deploying all instances simultaneously for maximum speed','Replacing instances incrementally — one or a few at a time — while keeping the rest serving traffic, ensuring zero downtime during deployments','Deploying only to a single region at a time','Deploying only during off-peak hours'],
  1,'Rolling deployments eliminate downtime by ensuring some instances are always available. Combined with readiness probes, unhealthy new versions can be rolled back automatically before they impact all users.',1,6),

('devops-infrastructure-engineer','fundamentals','What is the four golden signals of site reliability monitoring?',
  ARRAY['CPU, memory, disk, network','Latency, traffic, errors, and saturation — the most important signals for understanding the health and performance of a production service','Uptime, response time, error rate, throughput','Availability, reliability, maintainability, serviceability'],
  1,'The four golden signals (Google SRE Book) provide a minimal but complete view of service health. Latency = how long requests take. Traffic = load. Errors = failure rate. Saturation = how close to capacity.',1,7),

('devops-infrastructure-engineer','fundamentals','What does "idempotent" mean in the context of Terraform operations?',
  ARRAY['Terraform plans run twice as fast on repeated operations','Running the same Terraform plan multiple times produces the same infrastructure state without unintended changes or duplicates','Idempotency only applies to Terraform destroy operations','Terraform is not idempotent by design'],
  1,'Terraform''s declarative model means applying the same configuration repeatedly has no additional effect if the desired state already matches. This makes automation safe and re-runnable without side effects.',1,8),

('devops-infrastructure-engineer','applied','Your Kubernetes cluster is running at 80% CPU saturation consistently. The product team wants to add two new services next week. What do you do?',
  ARRAY['Add the services and monitor for issues','Analyse current resource requests vs actual usage; right-size pods with appropriate requests/limits; implement Horizontal Pod Autoscaler for variable-load services; evaluate whether cluster nodes need scaling; consider Cluster Autoscaler for dynamic node provisioning — address the headroom problem before adding load','Scale down existing services to make room','Ask the product team to delay their services indefinitely'],
  1,'80% sustained CPU is too close to capacity — 20% headroom leaves little buffer for spikes. Right-sizing may reveal over-provisioned pods. HPA handles traffic spikes automatically. CA adds nodes when needed.',2,9),

('devops-infrastructure-engineer','applied','A deployment goes out and p99 latency immediately spikes from 50ms to 800ms. The team wants to roll back. What is your process?',
  ARRAY['Delete and redeploy the previous deployment manually','Trigger a Kubernetes rollout undo (kubectl rollout undo); verify the rollback is progressing correctly via rollout status; confirm metrics return to baseline; preserve logs and investigate the root cause before next deploy','Restart all pods in the deployment','Increase the timeout threshold to mask the latency'],
  1,'kubectl rollout undo triggers an immediate rolling rollback using the previous ReplicaSet. Verification prevents declaring success before it completes. Root cause investigation is mandatory — the same deploy will fail again otherwise.',2,10),

('devops-infrastructure-engineer','applied','How would you implement secrets management in a CI/CD pipeline for a team of 15 engineers?',
  ARRAY['Store secrets as plain text in the repository with a .gitignore rule','Use a secrets manager (AWS Secrets Manager or GitHub Actions Secrets with OIDC): secrets never in code; CI assumes an IAM role via OIDC to access secrets at runtime; access is logged and audited; secrets rotate automatically; individual engineers do not need production secret values','Use environment variables set by each engineer on their machine','Encrypt secrets and commit them to the repository'],
  1,'OIDC-based IAM role assumption eliminates static credentials in CI. Secrets manager provides audit logs and rotation. Engineers not needing production secrets is a least-privilege implementation of the separation of concerns.',2,11),

('devops-infrastructure-engineer','applied','Describe how you would set up a meaningful on-call rotation for an engineering team of 12, covering a SaaS product running in EU time zones.',
  ARRAY['Have the most senior engineer on call permanently','Implement a weekly rotation across all engineers (with adequate training for each); business hours primary support with off-hours escalation for SEV1 only; clear SEV definitions; a runbook for every known failure mode; alert fatigue management (tune out noisy alerts); post-mortems for all SEV1/SEV2 incidents; compensation for on-call burden','Rely on monitoring tools to fix issues automatically','Hire a dedicated on-call team'],
  1,'Broad rotation distributes burden and spreads operational knowledge. SEV definitions prevent alert fatigue. Runbooks reduce MTTR. Post-mortems improve reliability over time. Compensation for on-call is both fair and legally required in some EU jurisdictions.',2,12),

('devops-infrastructure-engineer','applied','A PostgreSQL RDS instance is showing high read latency during peak hours. How do you diagnose and address it?',
  ARRAY['Immediately upgrade to a larger instance type','Query pg_stat_activity for long-running queries; check slow query logs; use EXPLAIN ANALYZE on expensive queries; evaluate adding read replicas for read-heavy workloads; review connection pool sizing (PgBouncer); check for missing indexes; then consider vertical scaling as a last resort','Add more application servers to distribute read load','Restart the RDS instance during the next maintenance window'],
  1,'Database performance problems are usually query or schema problems, not hardware problems. Slow query logs and EXPLAIN ANALYZE reveal the actual bottleneck. Read replicas help with genuinely read-heavy workloads. Vertical scaling is a band-aid.',2,13),

('devops-infrastructure-engineer','applied','Your team is deploying to AWS across two regions for disaster recovery. How do you manage infrastructure state consistently across regions?',
  ARRAY['Manually replicate changes to each region after testing in the primary','Use a single Terraform workspace per region with shared modules for common components; store state in S3 with DynamoDB locking; use CI/CD to apply changes to both regions in parallel with gates; test in staging before production; maintain runbooks for cross-region failover','Use AWS Console for secondary region changes to keep Terraform simple','Deploy to regions on alternate days'],
  1,'Workspace-per-region with shared modules keeps configurations DRY while allowing region-specific variables. Remote state with locking prevents concurrent applies. Automated promotion through environments catches issues before production.',2,14),

('devops-infrastructure-engineer','applied','What is the purpose of a service mesh and when is it worth the operational complexity?',
  ARRAY['A service mesh is a type of CDN for microservices','A service mesh (Istio, Linkerd) provides inter-service traffic management, mTLS, observability (distributed tracing), and circuit breaking as infrastructure — rather than requiring each service to implement these; worth it at 10+ microservices with cross-cutting concerns','Service meshes replace the need for API gateways','Service meshes are only useful for gRPC communications'],
  1,'Service meshes solve cross-cutting concerns consistently without code changes to each service. The operational overhead (learning curve, debugging complexity) is significant. At small scale, per-service library approaches (HTTP clients with retry logic) are simpler.',2,15),

('devops-infrastructure-engineer','applied','How would you approach reducing AWS infrastructure costs by 30% without degrading reliability or performance?',
  ARRAY['Shut down non-production environments permanently','Audit resource utilisation (right-size over-provisioned instances); move suitable workloads to Spot/Graviton instances; implement auto-scaling to eliminate idle capacity; review data transfer costs (often overlooked); use savings plans for committed baseline workloads; eliminate orphaned resources; optimise RDS storage and IOPS configuration','Only reduce costs in development environments','Migrate entirely to a cheaper cloud provider'],
  1,'Cost optimisation is systematic: measure first, then optimise. Right-sizing is typically the largest opportunity. Spot instances for batch workloads can save 60-70%. Graviton3 offers better price-performance for most workloads. Savings Plans reduce on-demand costs for stable baseline.',2,16),

('devops-infrastructure-engineer','korelabs','KoreOS processes webhook events from customer integrations and must maintain SLA guarantees even when a customer''s integration source sends a burst of 100x normal traffic. Design the ingestion architecture.',
  ARRAY['Accept all events synchronously and scale compute horizontally to handle bursts','Implement per-customer rate limiting at the API gateway; buffer events in SQS per customer with customer-specific queues; use SQS message group IDs to preserve ordering per integration; auto-scale consumer workers from CloudWatch metrics on queue depth; implement dead-letter queues for failed processing; alert when queue depth exceeds thresholds','Use a single global queue for all events to simplify operations','Reject burst traffic with a 429 response'],
  1,'Queue-based ingestion decouples receipt from processing. Per-customer queues provide isolation. Message group IDs maintain ordering for ordered event streams. DLQs capture failed events for investigation. Autoscaling handles bursts without manual intervention.',3,17),

('devops-infrastructure-engineer','korelabs','Design the observability stack for KoreOS as it scales to 200 enterprise customers, each with multiple integrations generating continuous event streams.',
  ARRAY['Use CloudWatch with default metrics only — it covers most use cases','Implement three pillars: metrics (Prometheus + Grafana for service health, per-customer throughput, SLA adherence); logs (structured JSON logs → CloudWatch Logs Insights or Elasticsearch for debugging); traces (OpenTelemetry distributed tracing to debug cross-service latency); alerts on SLO burn rate rather than static thresholds; per-customer dashboards for customer success team','Deploy a single monitoring dashboard for the entire system','Rely on customer reports to identify issues'],
  1,'Three-pillar observability (metrics, logs, traces) covers different debugging scenarios. SLO-based alerting reduces alert fatigue by focusing on user impact. Per-customer metrics enable proactive support. OpenTelemetry standardises instrumentation.',3,18),

('devops-infrastructure-engineer','korelabs','KoreLabs'' enterprise customers in Germany require that their data not leave German AWS regions. How do you architect multi-tenancy to support this data residency requirement while keeping operational complexity manageable?',
  ARRAY['Tell customers their data stays in the EU (not just Germany) and call it compliant','Implement a control plane / data plane separation: shared control plane for configuration and management; isolated data plane deployments per data-residency region (eu-central-1 for Germany, eu-west-1 for others); customer records tagged with their residency region; routing at the API gateway layer; Terraform modules for consistent regional deployments','Run completely separate AWS accounts per customer','Use data encryption as a substitute for data residency'],
  1,'Control/data plane separation is the standard multi-tenant data residency pattern. The control plane can be global. Data plane deployments are regional. Customer routing at the API layer is transparent to the application. IaC modules ensure consistency across regions.',3,19),

('devops-infrastructure-engineer','korelabs','You are migrating KoreOS from a monolithic deployment to microservices. The existing monolith processes 10,000 events per minute with no downtime tolerance. How do you approach the migration?',
  ARRAY['Migrate everything at once during a maintenance window','Use the Strangler Fig pattern: route new event types to new microservices while the monolith handles existing ones; maintain a compatibility layer at the API boundary; migrate one integration type at a time with parallel running and comparison testing; decommission monolith components only after microservices are proven stable in production','Rewrite the entire system from scratch before deploying','Add microservices alongside the monolith with duplicate processing'],
  1,'Strangler Fig enables incremental migration without downtime. Parallel running (both monolith and microservice processing the same events, comparing outputs) validates correctness before cutting over. This is the industry-standard approach for zero-downtime migrations.',3,20);

-- ────────────────────────────────────────────
-- PRODUCT DESIGNER
-- ────────────────────────────────────────────
insert into quiz_questions (job_slug, tier, question, options, correct_index, explanation, points, order_index) values

('product-designer','fundamentals','What is the difference between UX and UI design?',
  ARRAY['UX is for web; UI is for mobile','UX (User Experience) covers the overall experience of interacting with a product — research, flows, information architecture, usability; UI (User Interface) focuses on the visual design of specific screens — typography, colour, spacing, components','They are the same discipline with different names','UI design comes before UX design in the process'],
  1,'UX encompasses the entire user journey, from understanding the problem to evaluating the solution. UI is the execution layer — how the solution looks and feels visually. Both are required; good UI on a bad UX is still a bad product.',1,1),

('product-designer','fundamentals','What is a design system and what problems does it solve?',
  ARRAY['A folder of Figma files shared across a team','A set of reusable components, design tokens, and guidelines that ensure visual and behavioural consistency across a product; it reduces duplication, speeds up design and development, and creates a shared language between designers and engineers','A style guide printed for stakeholder presentations','A system for organising design files in cloud storage'],
  1,'Design systems create consistency at scale. Tokens (colors, spacing, typography) encode design decisions that propagate across products. Component libraries reduce the cost of building new screens. Documentation bridges design intent and engineering implementation.',1,2),

('product-designer','fundamentals','What is WCAG 2.1 AA and why does it matter for product design?',
  ARRAY['A web performance benchmark','Web Content Accessibility Guidelines: a standard defining minimum accessibility requirements (4.5:1 colour contrast, keyboard navigability, screen reader compatibility); required by law in the EU under EN 301 549; and good design practice that improves usability for everyone','A design file format standard','A JavaScript performance API'],
  1,'WCAG 2.1 AA compliance is legally required for many products in the EU. Beyond compliance, accessible design benefits users with situational impairments (bright sunlight, noisy environments, temporary disabilities). Colour contrast is the most commonly failed criterion.',1,3),

('product-designer','fundamentals','What is a cognitive load in UX and how do you reduce it?',
  ARRAY['The time it takes a page to load in the user''s browser','The mental effort required to use a product; reduced by progressive disclosure (showing only relevant information at each step), familiar patterns, clear visual hierarchy, and reducing the number of decisions required at any moment','The number of pixels rendered on screen','The computational load on the user''s device'],
  1,'Cognitive load theory (Sweller) applies directly to interface design. Chunking information, using conventions, progressive disclosure, and good visual hierarchy all reduce the mental effort of using a product — directly improving task completion.',1,4),

('product-designer','fundamentals','What is the difference between qualitative and quantitative user research?',
  ARRAY['Qualitative uses larger sample sizes; quantitative uses smaller ones','Qualitative research (interviews, usability tests) reveals why users behave as they do — rich, contextual insight with small samples; quantitative (analytics, surveys) reveals what users do and how many — statistical patterns from larger samples','Quantitative research is always more accurate','Qualitative research cannot be used to make design decisions'],
  1,'Both types answer different questions. Qualitative: "why do users abandon at checkout?" Quantitative: "what percentage abandon at checkout?" Good research combines both — quantitative data identifies problems, qualitative reveals causes.',1,5),

('product-designer','fundamentals','What is Fitts''s Law and how does it apply to UI design?',
  ARRAY['A law stating that users prefer minimalist interfaces','The time to click a target is proportional to the distance and inversely proportional to the target size; larger, closer targets are faster to hit — applies to button sizing, touch target minimums (44px), and placing frequent actions within easy reach','A rule stating menus should have fewer than 7 items','A guideline for font sizes in body text'],
  1,'Fitts''s Law is a predictive model of pointing time. Practical implications: make important buttons large and near where the user''s cursor or thumb already is. Touch targets should be at least 44px (Apple HIG, WCAG) to be reliably tappable.',1,6),

('product-designer','fundamentals','What is the purpose of information architecture (IA) in product design?',
  ARRAY['Designing the visual layout of information on a screen','Organising and labelling content so users can find and understand it — the structure of navigation, categorisation, and the relationships between content types in a product','Designing database schemas for a product','Choosing fonts and colours for a product'],
  1,'Good IA makes a product feel intuitive because its structure matches users'' mental models. Card sorting and tree testing are common IA research methods. Poor IA makes users feel lost regardless of visual polish.',1,7),

('product-designer','fundamentals','What distinguishes a good usability test from a bad one?',
  ARRAY['A good usability test has more participants','A good usability test uses realistic tasks from real user goals, observes without guiding, asks participants to think aloud, avoids leading questions, and is evaluated by the team rather than just the designer','Good usability tests are conducted in a lab with eye tracking','Good usability tests only test finished, high-fidelity prototypes'],
  1,'5 usability test participants reveal 85% of usability issues (Nielsen). Realistic tasks prevent testing whether users can click a button rather than whether they can accomplish a goal. Think-aloud protocol externalises reasoning.',1,8),

('product-designer','applied','You are designing the onboarding flow for KoreOS. An enterprise IT admin needs to connect Slack, Jira, and Notion in under 20 minutes. Design the key principles of this flow.',
  ARRAY['Show all configuration options on one screen to minimise navigation','Structure as a wizard with one integration per step: show clear progress (1/3 complete), explain what permissions are needed and why before requesting OAuth, provide a preview of what KoreOS will see post-connection, celebrate successful connections to build momentum, and offer a "test connection" step before proceeding','Require all integrations to be connected simultaneously','Send the admin documentation and let them configure at their own pace'],
  1,'Wizard patterns reduce cognitive load by focusing on one decision at a time. Permission transparency builds trust — especially critical for an AI product reading organisational data. Progress indicators reduce abandonment. Testing connections early prevents bad state.',2,9),

('product-designer','applied','A user research session reveals that enterprise users are confused by KoreOS''s "coordination waste" metric — they understand the number but not what to do with it. How do you respond to this finding?',
  ARRAY['Simplify the metric to a single score and move on','This finding reveals an actionability gap: users need to understand the metric''s components and implications, not just its value. Redesign around action: surface the top 3 contributing factors with specific recommendations; use progressive disclosure to show detail; A/B test different framings; validate the redesign with the same user segment','Remove the metric entirely as it confuses users','Make the number larger so it feels more significant'],
  1,'A metric without action is just a number. The redesign should answer "so what?" immediately after showing the metric. Progressive disclosure lets power users go deeper. Validating with the same users closes the feedback loop.',2,10),

('product-designer','applied','You receive competing requests from sales ("make the product look impressive in demos") and engineering ("simplify the UI to reduce support tickets"). How do you navigate this?',
  ARRAY['Always defer to engineering since they know the product best','Reframe both requests around user goals: demo impressiveness and reduced complexity are often the same design — a product that is genuinely easy to understand looks impressive in demos. Facilitate a session with both teams to align on user outcomes rather than internal priorities, then design to those outcomes','Give each team what they want, creating two UI variants','Escalate to the CEO to make the final decision'],
  1,'Internal politics are often resolved by returning to user goals. A product that is genuinely clear does not need to be separately "demo-polished." Facilitation skills and user-centred framing are as important as visual design skills.',2,11),

('product-designer','applied','You are designing a notification system for KoreOS that surfaces AI-detected coordination issues in Slack. Users are already overwhelmed with notifications. How do you design for attention without contributing to noise?',
  ARRAY['Send one notification per detected issue to maximise coverage','Implement a batching and prioritisation layer: surface only high-confidence, high-impact issues; group related issues into a single digest notification; allow users to calibrate sensitivity; use Slack threading to contain follow-up without generating new notifications; measure open rates and actions taken, not just delivery','Reduce notification frequency to once per day regardless of issue urgency','Use red colour and strong language to make notifications feel urgent'],
  1,'Notification design must respect the user''s attention budget. High-confidence filtering reduces false positives. Batching prevents notification flood. User control over sensitivity builds trust. Measuring action rates, not just opens, reveals real utility.',2,12),

('product-designer','applied','How would you design the "Why KoreOS did this" explanation for an automated action taken in a user''s Jira board?',
  ARRAY['Show the raw ML model confidence score','Show a plain-language explanation at the appropriate level of detail: primary reason ("This task has had no updates for 7 days and 3 blockers are open"), secondary context ("Similar tasks in your team typically resolve within 4 days"), and an action link ("Mark as resolved / Snooze / This is wrong"). Log feedback for model improvement','Show a long technical explanation of the algorithm','Only show the action taken, not the reason'],
  1,'AI explanations must be at the right altitude — specific enough to be useful, not so technical as to be opaque. "This is wrong" buttons create a feedback loop. The explanation should answer "why now?" and "why this action?"',2,13),

('product-designer','applied','Describe your approach to designing for a colour-blind user on a dashboard that uses red/green to indicate good/bad performance.',
  ARRAY['Inform colour-blind users that the product does not support their condition','Replace red/green with colour-blind-safe palette (blue/orange or use WCAG-compliant hue pairs); always use a secondary indicator (icon, pattern, or text label) alongside colour so meaning is never communicated by colour alone; test with Figma''s colour blindness simulation; validate with actual colour-blind users','Add a "colour-blind mode" toggle that inverts all colours','Use only grayscale to avoid all colour accessibility issues'],
  1,'Never convey meaning through colour alone (WCAG 1.4.1). Colour-safe palettes (Okabe-Ito, Tableau 10 accessible) are available. Redundant encoding (icon + colour) ensures meaning survives both colour blindness and monochrome printing.',2,14),

('product-designer','applied','A stakeholder asks you to add a new feature to the home dashboard. You believe it will increase clutter and hurt key task completion. What do you do?',
  ARRAY['Add the feature as requested to avoid conflict','Validate your hypothesis with data: check if users currently struggle to complete key tasks (session recordings, funnel analysis); present the tradeoff explicitly with the stakeholder — "adding X may reduce Y by Z%"; propose an alternative (progressive disclosure, settings panel, secondary view); if still disagreed, propose an A/B test','Add the feature but make it visually small','Escalate to your manager'],
  1,'Design decisions should be defended with evidence, not opinion. Data-informed pushback is more credible than aesthetic disagreement. Proposing alternatives shows problem-solving rather than obstruction. A/B tests resolve genuine uncertainty.',2,15),

('product-designer','applied','How would you run a design review process that improves design quality without creating a bottleneck?',
  ARRAY['Have all designs reviewed by the whole company before implementation','Async design crits in Figma with structured feedback (What works? What is unclear? What would you change?); weekly design review for in-progress work, not just finished work; separate "correctness" reviews (accessibility, specs) from "quality" reviews (does this solve the problem?); clear decision rights (designer decides, stakeholder advises unless it affects business strategy)','Have only the design lead review all work','Review designs only after implementation to save time'],
  1,'Structured feedback reduces noise. Early-stage reviews (rough concepts) prevent rework on polish. Separating types of review prevents mixing accessibility feedback with aesthetic preference. Clear decision rights prevent design by committee.',2,16),

('product-designer','korelabs','Design the "first value moment" for a new KoreOS customer — the point where they first understand that KoreOS is working and that it was worth connecting their tools.',
  ARRAY['Show a dashboard with many metrics immediately after connection','Design a 24-hour hook: after initial connection, KoreOS observes silently for 24 hours then sends a Slack message with three specific examples from their actual data ("KoreOS noticed that this Jira epic has been waiting on this Slack thread for 4 days — here is what it did"). Make the first value moment concrete and specific to their organisation, not generic. Then open the dashboard with those same examples highlighted.','Show generic industry benchmarks as the first value moment','Require the customer to manually trigger their first analysis'],
  1,'First value moments must be specific and personal — generic dashboards create no "aha." Using real customer data from the first 24 hours is powerful. The Slack message format meets users where they already are. Specificity is the difference between "interesting" and "this is for me."',3,17),

('product-designer','korelabs','KoreOS needs to surface sensitive organisational insights (e.g., "Team X is experiencing 40% more coordination overhead than other teams") to different audiences: leadership, team managers, and individual contributors. Design the information architecture for role-based data access.',
  ARRAY['Show all data to all users and let managers decide what to share with their teams','Implement three view levels: Leadership (organisation-wide benchmarks, trend data, cross-team comparison — anonymised at team level); Manager (their team''s detailed data, peer comparison available to their level); IC (their own work patterns and suggestions, no cross-team comparison). Each level is designed separately — not just filtered. ICs see actionable personal insights; leaders see strategic signals. Design the escalation path (IC can share insights with their manager if they choose).','Show the same data with different colour schemes per role','Let each user customise what data they see'],
  1,'Sensitive organisational data requires intentional information architecture, not just access control. Different roles have different information needs and different implications of seeing comparative data. The escalation path (IC→manager) builds trust in the system.',3,18),

('product-designer','korelabs','How would you design the UX for a feature that automatically moves tasks between team members when it detects someone is blocked — an action that is significant and potentially unwanted?',
  ARRAY['Automate the action silently and show it in a log users can review later','Design a high-transparency, consent-respecting flow: KoreOS proposes the move rather than executing it; the notification includes full context ("why this task, why this person, why now"); the proposed recipient can decline; the original owner sees the proposal and can approve, modify, or dismiss; one-click override for all automated actions; sensitivity settings to calibrate when proposals are made. Never automate irreversible actions without explicit confirmation.','Execute immediately and provide an undo button within 5 seconds','Only automate moves within the same person''s task list'],
  1,'Automating consequential actions without consent destroys trust. Proposal flows with rich context respect human judgement. The recipient''s right to decline is critical — KoreOS is not authoritative. This design pattern (propose, not impose) is a core principle for trustworthy AI products.',3,19),

('product-designer','korelabs','KoreLabs is preparing a product demo for a 150-person logistics company. The buyer is a COO who cares about operational efficiency but is skeptical of AI tools. Design the demo experience.',
  ARRAY['Show all features of KoreOS in sequence over 45 minutes','Structure as a narrative, not a feature tour: open with their specific pain ("You lose an estimated €X per year to coordination overhead in logistics teams — here is how we calculated that"); show one concrete workflow being improved using synthetic data from their industry; demonstrate the "why this happened" transparency; show the control panel where their team sets boundaries on automation; close with a 90-day plan not a product roadmap. The demo should feel like it was built for them specifically.','Focus the demo entirely on the KoreOS dashboard UI','Show technical architecture diagrams to demonstrate robustness'],
  1,'COO buyers care about outcomes and risk, not features. Industry-specific framing shortens the "is this for me?" phase. Transparency controls address AI skepticism directly. A 90-day plan makes the abstract concrete. The best demos feel customised even when they are not.',3,20);

-- ────────────────────────────────────────────
-- OPERATIONS ANALYST
-- ────────────────────────────────────────────
insert into quiz_questions (job_slug, tier, question, options, correct_index, explanation, points, order_index) values

('operations-analyst','fundamentals','What is the difference between a KPI and a metric?',
  ARRAY['They are synonyms; all metrics are KPIs','A metric is any measurable value; a KPI (Key Performance Indicator) is a metric that has been selected as critical to achieving a specific business objective — KPIs are a subset of metrics, chosen deliberately','KPIs are used by executives; metrics are used by analysts','KPIs are always expressed as percentages'],
  1,'Not all metrics are KPIs. A good KPI is directly linked to a strategic objective, is measurable and actionable, and is monitored regularly. Organisations with too many KPIs dilute focus. The discipline is choosing the right few.',1,1),

('operations-analyst','fundamentals','What is the purpose of a cohort analysis?',
  ARRAY['Analysing the entire user base as a single group over time','Grouping users by a shared characteristic (e.g., signup month) and tracking their behaviour over time — useful for understanding retention, engagement trends, and whether product changes improved outcomes for new users versus existing ones','A type of A/B test','Analysing customer support ticket categories'],
  1,'Cohort analysis reveals patterns invisible in aggregate metrics. If overall retention is flat but new cohorts are retaining better, the product is improving for new users even while legacy users churn. Crucial for distinguishing product improvement from mix shift.',1,2),

('operations-analyst','fundamentals','What does SQL GROUP BY do and when would you use HAVING instead of WHERE?',
  ARRAY['GROUP BY sorts results alphabetically; HAVING filters before aggregation','GROUP BY aggregates rows sharing the same value in specified columns; WHERE filters rows before aggregation; HAVING filters after aggregation — used when the filter condition involves an aggregated value (e.g., HAVING count(*) > 5)','HAVING is an alias for WHERE in most databases','GROUP BY requires a unique key column'],
  1,'WHERE filters individual rows before they are grouped. HAVING filters the result of groupings. Classic example: find customers who placed more than 3 orders → GROUP BY customer_id HAVING count(*) > 3.',1,3),

('operations-analyst','fundamentals','What is process documentation and why does it matter for operational scale?',
  ARRAY['A legal record of company activities required by regulators','Written descriptions of how repeated tasks are performed — who does what, in what order, with what tools; enables consistent execution, reduces dependency on specific people, and makes processes improvable because they are explicit','A substitute for training new employees','Only relevant for manufacturing companies'],
  1,'Processes that exist only in people''s heads break when those people leave. Documentation enables delegation, identifies inefficiencies (steps that could be automated or eliminated), and creates a baseline for continuous improvement.',1,4),

('operations-analyst','fundamentals','What is the difference between correlation and causation in data analysis?',
  ARRAY['They are equivalent if the correlation coefficient is above 0.8','Correlation means two variables move together; causation means one causes the other. Correlation does not imply causation — a lurking variable or reverse causation may explain the relationship. Establishing causation requires controlled experiments or quasi-experimental designs.','Causation requires a correlation above 0.95','Correlation is used for quantitative data; causation for qualitative'],
  1,'The most common analytical error. Ice cream sales and drowning deaths are correlated (summer). Sunscreen sales and drowning deaths are correlated (beach-going). Causation requires ruling out confounders and establishing temporal precedence.',1,5),

('operations-analyst','fundamentals','What is a burn rate and how is it used in startup operations?',
  ARRAY['The rate at which server infrastructure is consumed','The rate at which a company spends its capital reserves (net burn = cash spent minus cash generated); runway = cash on hand ÷ net burn rate; used to plan fundraising timelines, make hiring decisions, and assess financial health','The rate of customer churn','How quickly product features are released'],
  1,'Burn rate is a fundamental operational metric for pre-profitability companies. At KoreLabs with €11M raised, understanding burn rate informs hiring pace, go-to-market timing, and the Series B fundraising timeline.',1,6),

('operations-analyst','fundamentals','What is a SLA (Service Level Agreement) and what are its key components?',
  ARRAY['A contract between two engineers about code quality','A formal agreement between a service provider and customer defining the level of service expected — typically covering uptime guarantees (e.g., 99.9%), response times, support hours, and the consequences of failures (credits, penalties)','An internal team process for resolving bugs','A technical specification for API endpoints'],
  1,'SLAs drive operational decisions: what uptime is required determines infrastructure design. SLA breach penalties create accountability. For KoreOS enterprise customers, SLAs around data processing latency and availability are part of commercial negotiations.',1,7),

('operations-analyst','fundamentals','What is the purpose of a retrospective in an operational context?',
  ARRAY['A meeting to celebrate past successes','A structured review of a completed period or incident to identify what worked, what did not, and what should change — distinct from blame assignment; focused on systems and processes rather than individual fault','A quarterly business review for investors','A meeting to plan next quarter''s roadmap'],
  1,'Retrospectives (and post-mortems for incidents) drive continuous improvement. The blameless format (systems thinking, not blame) encourages honest discussion of what actually happened. Without retrospectives, teams repeat the same mistakes.',1,8),

('operations-analyst','applied','KoreLabs has grown from 20 to 47 people in 12 months. The operations team (you) suspects that internal communication is becoming less efficient. How would you measure this?',
  ARRAY['Ask all employees to rate communication quality in a survey','Combine quantitative indicators (meeting hours per person per week, average response time to Slack messages by thread, number of Slack channels, email volume trends, cross-team ticket cycle times) with qualitative signals (interview team leads, analyse which decisions are taking longer); establish a baseline, then track changes monthly','Only track Slack message volume','Count the number of company all-hands meetings'],
  1,'Communication efficiency has both quantitative and qualitative dimensions. Hard metrics establish baselines and reveal trends. Qualitative interviews reveal why. At 47 people, the signal is still visible — at 150 it becomes harder to diagnose.',2,9),

('operations-analyst','applied','You are asked to build a report that shows the sales team how effectively their pipeline is converting. What metrics would you include and how would you structure the report?',
  ARRAY['Include every available sales metric on one page','Structure around the sales funnel: leads → qualified → proposal → negotiation → closed. For each stage: count, conversion rate to next stage, average time in stage, and conversion by rep/source/segment. Add a trend line for each conversion rate over the past 6 months. Surface the bottleneck stage (where conversion rate is lowest or dropping). Make the report actionable — each metric should connect to a decision.','Show only total revenue and number of closed deals','Create separate reports for each sales rep with no aggregated view'],
  1,'Pipeline reports should diagnose, not just count. Conversion rates reveal where leads are lost. Time-in-stage reveals where they stall. Trends reveal whether things are improving. The bottleneck is the most actionable insight.',2,10),

('operations-analyst','applied','A tool your team uses daily is being cancelled by its vendor in 60 days. You are responsible for evaluating replacements. How do you run this process?',
  ARRAY['Pick the replacement with the best G2 reviews','Document current tool usage (who uses it, for what, how often, what integrations exist); define evaluation criteria weighted by importance; identify 3–4 candidates; run structured trials with the actual users; assess migration effort (data export, integration rebuilding, retraining); compare total cost of ownership not just licence price; make a recommendation with a migration plan and timeline — 60 days is tight, start immediately','Ask each team member to vote on their preferred replacement','Select the cheapest option to minimise cost'],
  1,'Tool replacement touches people and integrations, not just software. User involvement in trials improves adoption. Migration effort is consistently underestimated. TCO includes implementation, training, and productivity loss during transition — not just the SaaS fee.',2,11),

('operations-analyst','applied','You notice that one customer success manager consistently closes support tickets faster than their peers. How would you investigate whether this is genuinely better performance or a measurement artefact?',
  ARRAY['Immediately promote this CSM based on the metric','Investigate: are they handling simpler ticket categories (compare by type)? Are they closing tickets without resolution (check re-open rate and customer satisfaction scores)? Are they based in a time zone with less after-hours complexity? Compare like-for-like before drawing conclusions; if the performance is genuine, interview the CSM to understand their approach and document it','Ignore the difference — variance is natural','Ask the CSM to take on more tickets to confirm performance'],
  1,'Metric gaming and confounds are common. Re-open rates and CSAT scores add depth to raw speed metrics. Normalising by ticket type reveals genuine vs. artefact performance. The goal is learning and replication, not just measurement.',2,12),

('operations-analyst','applied','KoreLabs is preparing for a Series B fundraise in 12 months. What operational data and systems should you have in place to support a smooth data room?',
  ARRAY['Gather the required data in the month before the fundraise begins','Build investor-grade metrics infrastructure now: MRR/ARR tracking with clear definitions, churn and net revenue retention, CAC and payback period by channel, pipeline coverage ratios, headcount and burn with 18-month projections, customer NPS and health scores, product usage metrics. Ensure data is reproducible — VCs will ask how you calculated every number. Clean historical data matters more than perfect current data.','Focus only on revenue metrics; VCs care about nothing else','Hire a CFO six months before the fundraise to build all the data infrastructure'],
  1,'Series B data rooms are rigorous. Investors calculate their own versions of your metrics and compare. Clear definitions, reproducible calculations, and clean historical data prevent the credibility-damaging situation of inconsistent numbers. 12 months is the right lead time.',2,13),

('operations-analyst','applied','The engineering team wants to implement a new sprint planning process. You are asked to evaluate whether it improved velocity after implementation. How would you design the measurement?',
  ARRAY['Compare velocity in the sprint immediately after implementation to the sprint immediately before','Design a proper before/after study: measure 6+ sprints before (to establish baseline variance) and 6+ sprints after (to see stabilised performance); control for confounds (team size changes, product complexity, holidays); use story points consistently defined; also measure quality metrics (bugs introduced, rework) not just speed; present the range of outcomes, not just averages','Track only story points completed per sprint','Ask the engineering team if they feel more productive'],
  1,'Single before/after comparisons are vulnerable to regression to the mean and confounds. Establishing baseline variance determines whether post-implementation changes are statistically meaningful. Process changes that improve speed but worsen quality are not improvements.',2,14),

('operations-analyst','applied','You are building KoreLabs'' first company-wide OKR process. The executive team wants it implemented next quarter. What are the most common failure modes and how do you avoid them?',
  ARRAY['OKRs always succeed if leadership supports them','Common failures: too many OKRs (dilutes focus — aim for 3 company OKRs, 3-5 per team); objectives that are actually tasks ("launch feature X") rather than outcomes ("reduce customer onboarding time by 40%"); key results that are not measurable; no mid-quarter check-ins; OKRs disconnected from day-to-day decisions. Avoid by running a pilot with one team first, training on the difference between tasks and outcomes, and building review cadences before the company-wide rollout.','The only risk is choosing the wrong objectives','OKRs only work in companies with more than 200 employees'],
  1,'OKR failure is well-documented and usually predictable. Too many objectives, poorly defined key results, and no review cadence are the top three. A pilot before company-wide rollout builds confidence and catches implementation issues early.',2,15),

('operations-analyst','applied','How would you approach building a centralised operations dashboard for KoreLabs leadership that is actually used, rather than built and forgotten?',
  ARRAY['Build the most comprehensive dashboard possible with all available data','Start with leadership''s actual questions ("what do I check each Monday?") not with available data; design for one decision per section; keep it to 8–10 metrics maximum; automate data freshness so it never requires manual updates; review it in a weekly leadership meeting for 4 weeks — if no one consults it, redesign, do not add more data','Present the dashboard at a company all-hands and call it done','Include all departmental metrics to ensure no team feels excluded'],
  1,'Dashboards fail because they are designed around data availability rather than decision support. The Monday morning test ("what do you check first?") reveals what actually matters. Automation prevents the dashboard from going stale. Usage in a regular cadence builds the habit.',2,16),

('operations-analyst','korelabs','KoreOS is designed to reduce coordination waste in organisations. Ironically, KoreLabs itself needs to demonstrate that it operates efficiently as a company. Design an internal operations measurement framework for a 47-person organisation.',
  ARRAY['Apply the same KoreOS metrics to KoreLabs internally as a proof of concept','Design a lightweight but rigorous framework: hiring (time-to-hire by role, offer acceptance rate, 90-day ramp time); product delivery (sprint velocity trend, bug escape rate, deployment frequency); customer (NPS, time-to-first-value, expansion revenue); business health (MRR growth, net burn, runway); people (eNPS, voluntary turnover). Review monthly at the leadership level; weekly at the team level. Resist the temptation to track everything — 15 well-chosen metrics beat 50 noisy ones.','Only track financial metrics — everything else is too subjective','Let each team define and measure their own metrics independently'],
  1,'At 47 people, operational overhead is real but data infrastructure should be lightweight. The framework covers the four dimensions that matter for a Series A company: people, product, customers, and money. Monthly cadence at leadership level prevents metric overload.',3,17),

('operations-analyst','korelabs','KoreLabs needs to build a customer health scoring system that predicts which accounts are at risk of churning before they give notice. What data would you use and how would you weight it?',
  ARRAY['Use NPS score as the only health indicator','Combine leading indicators with trailing ones: product engagement (active users/seats, feature adoption, integration health, weekly active usage); support signals (ticket frequency, sentiment, unresolved issues >7 days); relationship signals (last executive sponsor contact, open action items from QBRs); contract signals (time since last expansion, days to renewal). Weight by predictive power for your specific churn pattern — validate against historical churn data. Score weekly; alert CSMs when score drops by >15 points in a week.','Use only renewal date proximity as the risk indicator','Survey all customers monthly and use their satisfaction rating'],
  1,'Health scores with only one or two inputs are unreliable. Leading indicators (usage, support sentiment) matter more than trailing ones (NPS). Validating weights against historical churn data is essential — otherwise you are guessing at importance. Weekly scoring catches deterioration early.',3,18),

('operations-analyst','korelabs','As KoreLabs scales from 47 to 150 people, which operational processes will break first and how would you prioritise rebuilding them?',
  ARRAY['All processes break at the same rate as companies scale','Processes most likely to break first: informal knowledge transfer (what worked at 47 people is not documented); hiring and onboarding (bottlenecks on founders as reference points); cross-team coordination (the problem KoreOS solves for customers will emerge internally); goal-setting and prioritisation (conflicting priorities become visible at 80+ people); finance operations (expense management, payroll complexity). Prioritise: first formalise knowledge and onboarding (the highest leverage intervention for scale); then goal-setting processes; then coordination tooling.','None will break if you hire experienced operators','Financial processes break first because they are most complex'],
  1,'Scaling inflection points are predictable. The processes that rely on shared implicit context break first — because at 150 people, that context no longer exists. Onboarding is the highest-leverage intervention because every new hire benefits from it, and it degrades fastest as the company grows.',3,19),

('operations-analyst','korelabs','KoreLabs is considering expanding from Amsterdam/Berlin to a third European office. You are asked to evaluate candidate cities. Design the evaluation framework.',
  ARRAY['Choose the city with the lowest office rental costs','Evaluate across four dimensions: talent (depth of engineering/design talent pool, university pipeline, competitive density, remote-work culture); business (customer proximity, regulatory environment, time zone compatibility with Amsterdam/Berlin, government incentives); operational (employment law complexity, payroll setup, benefits norms, language considerations); culture (alignment with KoreLabs'' European identity, quality of life for retention). Weight dimensions by current constraint — if hiring is the bottleneck, talent depth matters most. Visit shortlisted cities with a team member from each relevant function before deciding.','Only consider cities in the EU for regulatory simplicity','Choose based on where the founding team wants to live'],
  1,'City expansion decisions have long-term consequences. Four-dimension evaluation prevents optimising for a single factor (cost) at the expense of others (talent quality). Weighting by current constraint prioritises what actually limits growth. In-person visits prevent decisions made entirely from spreadsheets.',3,20);
