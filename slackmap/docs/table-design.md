---
type: reference
title: "Table design"
description: "The single-table key layout of the slackmap table: which entity lives under which PK, SK_GSI, LSI and GSI keys (lines, spots, guides, editors, changelogs)."
nav: { order: 40 }
---

# Table design

| PK                  | SK_GSI                 | LSI                   | GSI_SK      | GSI2           | GSI2_SK                 | GSI3   | GSI3_SK                 |
| ------------------- | ---------------------- | --------------------- | ----------- | -------------- | ----------------------- | ------ | ----------------------- |
| line:{id}           | lineDetails            |                       | type:{type} | country:{code} | featureType:line        |        |                         |
| spot:{id}           | spotDetails            |                       | spot:{id}   | country:{code} | featureType:spot        |        |                         |
| guide:{id}          | guideDetails           |                       | guide:{id}  | country:{code} | featureType:guide       |        |                         |
| feature:{id}:{type} | featureEditor:{userId} | editorReason:{reason} | type:{type} |                |                         |        |                         |
| feature:{id}:{type} | changelog:{date}       |                       |             | country:{code} | featureChangelog:{date} | global | featureChangelog:{date} |
