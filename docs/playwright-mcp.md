# Installing Playwright MCP with Claude Code in VSCode

**Model Context Protocol (MCP) enables AI assistants to control web browsers through natural language.** Playwright MCP, Microsoft's official browser automation server, brings this capability to Claude Code in VSCode—allowing you to generate tests, automate workflows, and debug applications with AI assistance. This guide provides current, verified instructions for setup and usage as of November 2025.

## Understanding the technology stack

Before diving into installation, understanding what you're working with ensures smoother setup. **MCP is an open protocol announced by Anthropic in November 2024** that standardizes how AI applications connect to external tools and data sources. Think of it as a USB-C port for AI—a universal connector that transforms the complex N×M integration problem into a simple M+N solution.

Playwright MCP specifically enables browser automation through **accessibility tree snapshots rather than vision models or screenshots**. This approach is faster, more reliable, and deterministic—interacting with elements by role and name rather than pixel coordinates. The current stable version is **0.0.45** (released November 2025), with active development from Microsoft continuing.

Claude Code refers to **Anthropic's official AI coding assistant**, not to be confused with "Cline" (formerly Claude Dev), a popular community extension. Claude Code offers both a terminal-based CLI and a beta VSCode extension. For this guide, we'll cover both integration methods with Playwright MCP.

## Prerequisites and system requirements

**Node.js version 18 or newer** is the primary requirement. Verify your installation by running `node --version` in your terminal—you should see v18.0.0 or higher. The Node.js installation includes both npm (Node Package Manager) and npx (Node Package Executor), which you'll use to run Playwright MCP.

Windows users should note a critical caveat: **avoid installing Node.js in paths containing spaces**. The default "Program Files" location can cause configuration issues. If you've already installed Node.js there, you'll need to use full paths like `C:\\Program Files\\nodejs\\npx.cmd` in your configuration files instead of just `npx`.

For VSCode integration, ensure you're running **VS Code version 1.98.0 or higher**. The GitHub Copilot extension (if using Copilot's MCP features) should also be up to date. An active internet connection is required for initial setup and downloading browser binaries.

## Installing Claude Code for VSCode

Claude Code installation varies depending on whether you prefer the CLI-based workflow or the new VSCode extension. **The CLI method offers more stability** as the VSCode extension remains in beta as of November 2025.

### CLI installation method

Install Claude Code globally using npm:

```bash
npm install -g @anthropic/claude
```

After installation, run `claude` from any directory to initialize the tool. It will prompt you to authenticate and configure basic settings. When you run `claude` from VSCode's integrated terminal, it automatically installs a companion extension that enables features like automatic diff viewing, selection context sharing, and diagnostic awareness.

The CLI stores its configuration in `~/.claude.json` on Linux, `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS, and `%APPDATA%\Claude\claude_desktop_config.json` on Windows. This configuration file will house your MCP server settings.

### VSCode extension installation

For the graphical interface approach, search for "Claude Code" by Anthropic in the VSCode Extension Marketplace. The extension adds a sidebar panel accessible via the Spark icon or keyboard shortcut (`Cmd+Esc` on Mac, `Ctrl+Esc` on Windows/Linux). This beta release offers real-time diff viewing, file management with @-mentions, and integrated MCP server access—though **stability may vary compared to the CLI**.

## Installing Playwright MCP

The beauty of Playwright MCP installation lies in its simplicity—you don't need to globally install the package. Using `npx` allows you to run the latest version on-demand, ensuring you're always current.

### Quick installation with Claude Code CLI

Navigate to your project directory and run:

```bash
claude mcp add playwright npx @playwright/mcp@latest
```

This command registers Playwright MCP for the current project. The `--scope` flag offers flexibility: use `-s user` to make it available across all your projects, or `-s project` to share the configuration via a `.mcp.json` file (ideal for version control).

### Manual configuration approach

Alternatively, edit your Claude configuration file directly. For Linux users, open `~/.claude.json` and add:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

The `-y` flag automatically confirms prompts during execution. On Windows, replace `"command": "npx"` with the full path: `"command": "C:\\\\Program Files\\\\nodejs\\\\npx.cmd"` to avoid path resolution issues.

### Installing browser binaries

**This step is critical and must be completed manually.** Never let the AI assistant attempt to install browsers—it requires elevated permissions and will fail. Run:

```bash
npx playwright install chromium
```

This downloads the Chromium browser binary that Playwright will control. You can also install `firefox` or `webkit` if needed for cross-browser testing. Confirm successful installation by checking the cache directory: `~/.cache/ms-playwright` on Linux/Mac or `%USERPROFILE%\AppData\Local\ms-playwright` on Windows.

## Configuration for advanced scenarios

While the basic configuration works for most use cases, **Playwright MCP supports over 40 command-line arguments** for fine-tuned control.

### Browser and display options

Running in **headless mode** (without a visible browser window) is essential for CI/CD pipelines:

```json
{
  "args": ["@playwright/mcp@latest", "--headless", "--browser", "chrome"]
}
```

The `--browser` flag accepts `chrome`, `firefox`, `webkit`, or `msedge`. For development, omit `--headless` to watch the browser in action—valuable for debugging test generation.

### Session persistence and authentication

By default, Playwright MCP uses a persistent browser profile, storing cookies and login states between sessions. This mimics regular browser behavior. For testing isolated scenarios, enable ephemeral mode:

```json
{
  "args": ["@playwright/mcp@latest", "--isolated"]
}
```

To reuse authenticated sessions across projects, specify a custom profile location:

```json
{
  "args": [
    "@playwright/mcp@latest",
    "--user-data-dir", "/path/to/custom/profile"
  ]
}
```

You can also load pre-saved authentication states using `--storage-state /path/to/state.json`, useful for skipping login flows in test scenarios.

### Security and network controls

**Origin restrictions** prevent the browser from accessing unwanted sites:

```json
{
  "args": [
    "@playwright/mcp@latest",
    "--allowed-origins", "https://example.com;https://trusted.com",
    "--blocked-origins", "ads.tracker.com;analytics.spam.com"
  ]
}
```

The semicolon-separated lists provide allowlist and blocklist functionality. For corporate environments with proxy requirements:

```json
{
  "args": [
    "@playwright/mcp@latest",
    "--proxy-server", "http://proxy:3128",
    "--proxy-bypass", ".local,.dev"
  ]
}
```

### Timeout adjustments

Default timeouts (5 seconds for actions, 60 seconds for navigation) work for most scenarios. Slow networks or heavy pages may require adjustments:

```json
{
  "args": [
    "@playwright/mcp@latest",
    "--timeout-action", "10000",
    "--timeout-navigation", "120000"
  ]
}
```

Values are in milliseconds. Playwright's built-in retry mechanisms make explicit waits unnecessary in most cases.

### Optional capabilities

Enable advanced features using the `--caps` flag:

```json
{
  "args": ["@playwright/mcp@latest", "--caps", "vision,pdf,tabs"]
}
```

**Vision mode** enables coordinate-based clicking (X,Y positions) rather than accessibility tree interactions—use sparingly as it's less reliable. **PDF capability** allows saving pages as PDFs. **Tabs capability** unlocks tab management tools for multi-tab scenarios.

## Verifying your installation

After configuration, verification ensures everything works before attempting complex workflows.

### Testing with Claude Code CLI

Start Claude from your project directory:

```bash
cd /path/to/your/project
claude
```

Once the Claude prompt appears, list available MCP servers:

```bash
/mcp
```

You should see Playwright listed with its 26+ available tools. For a live test, issue a simple command:

```
Use playwright mcp to navigate to example.com and take a screenshot
```

**A browser window should open, navigate to the site, and close automatically.** If you encounter errors, the output will indicate whether the issue stems from MCP connection, browser installation, or configuration.

### Testing with VSCode and GitHub Copilot

If using VSCode's built-in MCP support (available with GitHub Copilot), open the Command Palette and run `MCP: List Servers`. Playwright should appear with a "Running" status indicator. Click it and select "Show Output" to view the server logs.

In Copilot Chat, type `#` to open the tool picker. Playwright tools like `browser_navigate`, `browser_click`, and `browser_snapshot` should be visible. Test with a simple prompt:

```
Use Playwright to navigate to google.com
```

The browser should launch and navigate. Check the output panel for any errors if it doesn't work.

### Checking tool availability

Type `/mcp` in Claude Code to view the complete tool list. **Playwright MCP provides 26 core tools**, including:

- **browser_navigate** - Go to URLs
- **browser_click** - Click elements by role/name
- **browser_type** - Enter text into fields  
- **browser_snapshot** - Capture accessibility tree (faster than screenshots)
- **browser_fill_form** - Fill multiple form fields at once
- **browser_evaluate** - Execute JavaScript on the page
- **browser_console_messages** - Read browser console output
- **browser_network_requests** - Inspect network activity

With the tabs capability enabled, you also get `browser_tabs` for tab management. Vision mode adds coordinate-based interaction tools.

## Getting started with basic usage

With installation verified, explore practical usage patterns to understand Playwright MCP's capabilities.

### Simple navigation and information gathering

Start with basic navigation:

```
Navigate to news.ycombinator.com and tell me the top 5 story titles
```

Claude will use `browser_navigate` to load the page, then `browser_snapshot` to capture the accessibility tree. It parses the structured data to extract story titles—no screenshots or vision models required. This approach is **fast and deterministic**, relying on semantic HTML structure.

### Form filling and interaction

For more complex interactions:

```
Go to example.com/contact, fill in the form with name "Jane Doe" and email "jane@example.com", then submit it
```

Claude coordinates multiple tools: `browser_navigate`, `browser_fill_form`, and `browser_click`. The accessibility tree helps it identify form fields by their labels and roles. **Well-labeled HTML with proper aria attributes** significantly improves success rates.

### Authentication workflows

Handling logins requires a different approach. Rather than providing credentials in prompts (a security risk), use this pattern:

```
Navigate to app.example.com/login and open the browser in visible mode. I'll log in manually.
```

Ensure `--headless` is NOT in your configuration. The browser window opens visibly, you log in with your credentials, and the session persists. Then continue:

```
Now navigate to the dashboard and extract my recent activity
```

Cookies remain valid for the session duration, enabling authenticated workflows without hardcoding secrets.

### Test generation workflow

Playwright MCP excels at generating test code from natural language scenarios. Use structured prompts for best results:

```
You are a Playwright test generator. Run these steps using Playwright MCP tools:
1. Navigate to app.example.com
2. Click the "Sign Up" button
3. Fill the registration form with test data
4. Submit and verify success message appears

After completing all steps, generate a TypeScript Playwright test file using @playwright/test based on what you observed. Save it to the tests directory.
```

This pattern ensures Claude **executes actions first, then generates code** based on actual behavior rather than assumptions. The generated test will use Playwright's best practices including role-based locators and auto-retrying assertions.

## Best practices for Claude Code and Playwright MCP

Maximizing effectiveness requires understanding both the strengths and limitations of AI-assisted browser automation.

### Structuring effective prompts

**Be explicit on first use.** Say "Use playwright mcp" or "Use the Playwright MCP server" initially to ensure Claude doesn't default to bash commands or other tools. After the first interaction, context carries forward.

**Use step-by-step instructions** for complex workflows. Instead of "test the checkout flow," break it down:

```
1. Add item to cart
2. Proceed to checkout
3. Fill shipping information
4. Verify order summary
5. Generate a test file for this flow
```

Numbered steps help Claude sequence operations correctly and provide better error context if something fails.

**Specify expected outcomes** to enable verification:

```
Navigate to example.com/search, enter "playwright testing" and press Enter. The results page should show at least 5 results. Verify this is true.
```

This prompts Claude to add assertions, creating more robust tests.

### Optimizing your application for MCP

**Label UI elements properly.** Add `data-testid` attributes to important elements:

```html
<button data-testid="submit-button">Submit</button>
<input data-testid="email-input" type="email" />
```

Use semantic HTML with proper roles and ARIA labels. Playwright MCP relies on the accessibility tree, so elements without proper labels are harder to target. **A well-labeled UI dramatically improves success rates.**

**Keep frontend and tests in the same repository** when possible. This gives Claude context about your application structure, allowing it to suggest better locators and understand component relationships.

### Configuration recommendations

**Enable auto-approve in VSCode** for smoother workflows:

```json
{
  "chat.tools.autoApprove": true
}
```

This lets MCP tools execute without manual confirmation for each action. Use cautiously—understand what the AI will do before enabling.

**Pin to specific versions** in production or CI/CD environments:

```json
{
  "args": ["@playwright/mcp@0.0.45"]
}
```

Using `@latest` can introduce breaking changes unexpectedly. Lock versions after verifying compatibility with your setup.

**Use isolated mode for parallel testing** to avoid profile conflicts:

```bash
npx @playwright/mcp@latest --isolated
```

Each instance gets its own ephemeral browser context, enabling concurrent test execution.

### Development workflow patterns

**Start with simple tests** and gradually increase complexity. Begin with single-page interactions before multi-step workflows. This helps you understand Claude's decision-making patterns and identify when it struggles.

**Review and refactor generated code.** While Playwright MCP produces working tests, they often lack sophistication. Add:
- Custom expect messages for clearer failure diagnostics
- Proper test organization with describe/it blocks
- Intermediate assertions to catch failures early
- Error handling for flaky scenarios

**Save sessions for debugging** during development:

```bash
npx @playwright/mcp@latest --save-trace --save-video=1280x720 --output-dir ./debug-output
```

This records everything for post-mortem analysis when tests fail unexpectedly.

## Troubleshooting common issues

Despite careful setup, you may encounter issues. Here are solutions to the most frequent problems.

### Browser installation failures

**Error**: `Executable doesn't exist at [path]` or `Failed to launch browser`

**Cause**: Playwright browsers not installed or corrupted installation

**Solution**: Never let Claude install browsers—it requires elevated permissions. Run manually:

```bash
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit
```

Verify installation by checking the cache directory. On Linux/Mac: `ls ~/.cache/ms-playwright`. On Windows: `dir %USERPROFILE%\AppData\Local\ms-playwright`.

### Tools not exposed or undefined errors

**Error**: `Error calling tool browser_navigate: undefined` or tools don't appear in `/mcp` list

**Cause**: MCP server started but tools aren't registering with the AI session

**Solutions**:
1. **Completely restart** VSCode or your terminal session
2. **Terminate all MCP processes**: `pkill -f playwright` (Linux/Mac) or use Task Manager (Windows)
3. **Use a specific version** instead of @latest: `@playwright/mcp@0.0.30`
4. **Clear npm cache**: `npm cache clean --force`
5. **Verify configuration syntax** using a JSON validator

After changes, restart Claude Code or reload VSCode before testing again.

### WSL (Windows Subsystem for Linux) sandboxing issues

**Error**: `Chromium sandboxing failed in WSL environment`

**Cause**: Linux browsers in WSL lack required dependencies or sandboxing conflicts

**Quick fix** (security trade-off):

```json
{
  "args": ["@playwright/mcp@latest", "--no-sandbox"]
}
```

**Better fix** (install dependencies):

```bash
sudo apt-get update
sudo apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1 libasound2
```

Then remove `--no-sandbox` from your configuration.

### Version mismatch errors

**Error**: `MODULE_NOT_FOUND` or `Cannot find module './lib/servers/snapshot'`

**Cause**: Incompatible versions between MCP server and its dependencies

**Solution**: Use a known stable version:

```bash
npm install --save-exact @playwright/mcp@0.0.30
```

The `--save-exact` flag prevents automatic updates to patch versions. Check the [official GitHub repository](https://github.com/microsoft/playwright-mcp) for the latest stable release.

### Port conflicts and server startup failures

**Error**: `Port 3000 already in use` or `Failed to start MCP server`

**Solution**: Specify a custom port:

```json
{
  "args": ["@playwright/mcp@latest", "--port", "8931"]
}
```

Identify what's using the port: `lsof -i :3000` (Mac/Linux) or `netstat -ano | findstr :3000` (Windows). Kill the process or choose a different port.

### Configuration file not found or invalid

**Error**: `Cannot find configuration file` or JSON parsing errors

**Solutions**:
1. **Verify file location**: Use full paths in your configuration
2. **Validate JSON syntax**: Use `jq` (Linux/Mac) or an online JSON validator
3. **Check file permissions**: Ensure the configuration file is readable
4. **Specify config explicitly**: `--config /full/path/to/config.json`

### Browser "already in use" errors

**Error**: `Browser is already in use for /root/.cache/ms-playwright/mcp-chrome`

**Cause**: Multiple MCP instances trying to use the same browser profile

**Solution**: Use isolated mode or separate profiles:

```bash
# Option 1: Isolated (ephemeral) mode
npx @playwright/mcp@latest --isolated

# Option 2: Separate profile per instance
npx @playwright/mcp@latest --user-data-dir /path/to/instance1/profile
```

## Tips and tricks for optimal usage

Experienced users have discovered patterns that maximize Playwright MCP's effectiveness.

### Viewing available tools

Type `/mcp` in Claude Code to see all configured MCP servers. Navigate to Playwright to view the complete tool list with descriptions. **Referencing specific tools** in prompts improves accuracy:

```
Use the browser_snapshot tool to capture the page structure, then use browser_evaluate to count div elements
```

### Combining with test management tools

Export test cases from tools like TestoMat.io or TestRail and feed them directly to Claude:

```
Here are 10 manual test scenarios from our test management system. Generate Playwright tests for each using MCP to verify functionality:
[paste scenarios]
```

This bridges the gap between manual QA and automation.

### Multi-browser testing patterns

Test across different browsers in a single session:

```
1. Navigate to example.com using chromium browser and take screenshot
2. Navigate to example.com using firefox browser and take screenshot  
3. Navigate to example.com using webkit browser and take screenshot
4. Compare the three screenshots and report any visual differences
```

Use the `--browser` configuration option or specify browsers in prompts if your MCP setup allows runtime switching.

### Authentication state management

After logging in manually, save the authentication state:

```
I've logged in. Use browser_evaluate to execute: 
localStorage.getItem('authToken')

Save this token and use storage-state to persist it
```

This enables reusing authenticated sessions across test runs without repeated manual logins.

### Debugging with traces and videos

Enable comprehensive recording:

```bash
npx @playwright/mcp@latest --save-trace --save-video=1920x1080 --save-session --output-dir ./test-artifacts
```

After test runs, open traces in Playwright Inspector: `npx playwright show-trace ./test-artifacts/trace.zip`. This provides a timeline of actions, screenshots at each step, and network activity—invaluable for debugging flaky tests.

### Custom timeout strategies

For pages with heavy JavaScript frameworks:

```json
{
  "args": [
    "@playwright/mcp@latest",
    "--timeout-navigation", "120000",
    "--timeout-action", "10000"
  ]
}
```

Combine with explicit wait instructions:

```
After clicking Submit, wait for the text "Success" to appear before proceeding
```

This leverages Playwright's auto-waiting while giving control over critical timing.

### Security-conscious automation

Use environment variables for sensitive data:

```json
{
  "args": ["@playwright/mcp@latest"],
  "env": {
    "TEST_USERNAME": "${TEST_USERNAME}",
    "TEST_PASSWORD": "${TEST_PASSWORD}"
  }
}
```

Reference these in prompts without exposing values:

```
Fill the login form using the TEST_USERNAME and TEST_PASSWORD environment variables
```

### Iterative test refinement

After generating initial tests, refine them iteratively:

```
Review the generated test file. Improve it by:
1. Adding custom expect messages
2. Splitting into smaller test functions  
3. Adding intermediate assertions
4. Extracting page objects for reusable locators
5. Adding error handling for network requests
```

This transforms mediocre generated code into production-quality tests.

## Understanding limitations and setting expectations

**Playwright MCP is powerful but not magical.** AI-assisted automation has inherent limitations that affect results.

### Variability in results

The same prompt may produce different results across runs. **Claude 3.5 Sonnet reportedly performs best** for browser automation tasks, but even it has off days. Complex scenarios may require multiple attempts or prompt refinements. This isn't a bug—it's the nature of LLM-based systems.

### Code quality expectations

Generated tests work but often lack sophistication. Expect to review and refactor:
- **Locators may be fragile**: Overly specific selectors that break with minor UI changes
- **Missing error handling**: No retry logic for flaky scenarios
- **Incomplete assertions**: Tests that verify action completion but not correct state
- **Poor organization**: Everything in one test function rather than modular structure

**Treat generated code as scaffolding**, not production-ready output. The value is rapid prototyping, not finished product.

### Element selection challenges

Playwright MCP sometimes struggles to click specific elements, choosing instead to navigate directly to destination URLs. This happens when the accessibility tree doesn't provide enough context. **Well-labeled UIs with proper semantic HTML** mitigate this issue significantly.

For visual-only elements (icons without text, canvas elements, complex SVG), the standard snapshot mode may fail. Enable vision mode as a fallback:

```bash
npx @playwright/mcp@latest --caps vision
```

However, coordinate-based clicking is less reliable and should be a last resort.

### Platform-specific quirks

**Windows** users face the most setup complexity, particularly with Node.js path issues and WSL configurations. **macOS** generally offers the smoothest experience. **Linux** falls in between, with WSL on Windows presenting the most challenges.

Docker support currently only works with **headless Chromium**, limiting its utility for development workflows where visible browsers help with debugging.

### Security considerations

**MCP servers execute with your user permissions.** This is a significant security consideration—a malicious prompt or compromised AI could execute dangerous commands. Never run Playwright MCP with elevated privileges (sudo/administrator). Use isolated mode and origin restrictions for sensitive operations. Avoid automating financial transactions or other high-risk actions without extensive safeguards.

### Resource consumption

Browser instances consume significant memory and CPU. **Monitor resource usage** when running multiple concurrent sessions. The default configuration works for 2-3 concurrent browsers on typical development machines. Beyond that, implement connection pooling, limit parallelism, or use remote Playwright servers.

### Maintenance burden

Playwright MCP updates frequently, sometimes with breaking changes. **Version pinning** is essential for stability. Expect to update configurations periodically as the protocol evolves. The June 2025 MCP specification introduced OAuth and structured outputs; the November 2025 release adds asynchronous operations and better scalability.

## Future-proofing your setup

As MCP continues evolving, keep these practices in mind for long-term success.

The **Model Context Protocol roadmap** includes server discovery mechanisms, standardized extensions, and multimodality (video streaming, bidirectional communication). The Playwright MCP implementation will likely expand its capabilities as these features arrive.

**Stay current with official sources**:
- Playwright MCP GitHub: [https://github.com/microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp)
- MCP Specification: [https://modelcontextprotocol.io/](https://modelcontextprotocol.io/)
- Claude Documentation: [https://docs.claude.com/en/docs/claude-code/](https://docs.claude.com/en/docs/claude-code/)

**Subscribe to update channels** for both Playwright MCP and Claude Code. Major changes are typically announced on GitHub releases and official blogs.

**Participate in the community.** The MCP ecosystem benefits from shared knowledge—GitHub Issues, Discord servers, and community forums provide valuable troubleshooting help and usage patterns.

## Conclusion

Playwright MCP with Claude Code represents a significant shift in how developers approach browser automation. **The accessibility tree-based approach offers speed and reliability** that screenshot-based methods can't match, while AI assistance accelerates test creation from hours to minutes.

Success requires understanding the technology's strengths and limitations. **Start simple**—basic navigation and interaction scenarios. Build confidence with the tools before attempting complex multi-step workflows. **Label your UIs properly** with semantic HTML and data-testid attributes. **Review generated code** rather than blindly trusting it. **Pin versions** for stability.

The current state (November 2025) shows a maturing ecosystem with strong industry adoption from Microsoft, Anthropic, OpenAI, and major development tool providers. While the technology has rough edges—particularly around AI variability and code quality—it delivers tangible value for teams willing to invest in proper setup and adopt best practices.

As the MCP protocol evolves toward its November 25, 2025 specification release with asynchronous operations and enhanced scalability, Playwright MCP will gain new capabilities. Early adopters who master the current system position themselves well for these future enhancements, building expertise in AI-assisted development workflows that are rapidly becoming industry standard.