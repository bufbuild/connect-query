// Copyright 2021-2022 Buf Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TransportProvider } from "connect-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createConnectTransport } from "@bufbuild/connect-web";
import { Example } from "./example";
import "./index.css";

const queryClient = new QueryClient();

/**
 * The application root
 */
export default function App() {
  const transport = createConnectTransport({
    baseUrl: "https://demo.connect.build",
  });
  return (
    <TransportProvider transport={transport}>
      <QueryClientProvider client={queryClient}>
        <Example />
        <ReactQueryDevtools initialIsOpen />
      </QueryClientProvider>
    </TransportProvider>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<App />);
}
