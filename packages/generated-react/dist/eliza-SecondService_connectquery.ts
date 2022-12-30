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

// @generated by protoc-gen-connect-query v0.0.8 with parameter "target=ts"
// @generated from file eliza.proto (package buf.connect.demo.eliza.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import { createQueryService } from "@bufbuild/connect-query";
import { MethodKind } from "@bufbuild/protobuf";
import { SayRequest, SayResponse } from "./eliza_pb.js";

export const typeName = "buf.connect.demo.eliza.v1.SecondService";

/**
 * Say is a unary request demo. This method should allow for a one sentence
 * response given a one sentence request.
 *
 * @generated from rpc buf.connect.demo.eliza.v1.SecondService.Say
 */
export const say = createQueryService({
  service: {
    methods: {
      say: {
        name: "Say",
        kind: MethodKind.Unary,
        I: SayRequest,
        O: SayResponse,
      },
    },
    typeName: "buf.connect.demo.eliza.v1.SecondService",
  },
}).say;
