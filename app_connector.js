const {
  HttpUtils,
  HttpUtils: { request, successResponse, errorResponse },
  STATUS,
} = require("quickwork-adapter-cli-server/http-library");


const app = {
    name : "freshdesk",
    alias : "freshdesk",
    description : "The freshdesk connector it is basically a CRM",
    version : "1",
    config : {"authType":"api_key"},
    webhook_verification_required : false,
    internal : false,
    connection : {
        input_fields : () => [
          {
            key: "domain",
            name: "Domain",
            controlType: "text",
            required: true,
            type:  "string",
            hintText: "The helpdesk name of your Freshdesk account. E.g., if your Freshdesk account URL is https://demohelp.freshdesk.com, then demohelp is your helpdesk name.",
            helpText: "The helpdesk name of your Freshdesk account. E.g., if your Freshdesk account URL is https://demohelp.freshdesk.com, then demohelp is your helpdesk name.",

          },
            {
              key : "apiKey",
              name: "API Key",
              controlType : "password",
              required: true,
              type : "string",
              hintText: "Enter API key",
              helpText : "Enter API key",
              isExtendedSchema : false
            }
        ],

        authorization: {
            type: "api_key",

            credentials: (connection) => {
                return connection.input["apiKey"];
            }
        }
    },
    actions : {
      create_ticket: {
        description: "Create a ticket",
        hint: "Create a <b>ticket</b> in <b>Freshdesk</b>",

        input_fields: () => [
          {
            key: "subject",
            name: "Subject",
            hintText: "The subject of the ticket you want to create. The default value is null",
            helpText: "The subject of the ticket you want to create. The default value is null",
            required: true,
            type: "string",
            controlType: "text",
            isExtendedSchema: false,
          },
          {
            key: "description",
            name: "Description",
            hintText: "",
            helpText: "The description of the ticket in the HTML format",
            required: true,
            type: "string",
            controlType: "text",
            isExtendedSchema: false,
          },
          {
            key: "priority",
            name: "Priority",
            hintText: "Choose the priority",
            helpText: "Choose the priority",
            required: true,
            type: "string",
            controlType: "select",
            isExtendedSchema: false,
            pickList: [["Low", 1], ["Medium", 2], ["High", 3], ["Urgent", 4]],
            },
            {
              key: "status",
              name: "Status",
              hintText: "Choose the status",
              helpText: "Choose the status",
              required: true,
              type: "string",
              controlType: "select",
              isExtendedSchema: false,
              pickList: [["Open", 2], ["Pending", 3], ["Resolved", 4], ["Closed", 5]],
              },
         
         
          {
            key: "requesterEmail",
            name: "Requester's Email",
            hintText: "The email ID of a person requesting to create a ticket Note: If you specify the email address or requester ID of an existing contact, he/she will be considered as the requester of the ticket. If you specify the email address of a new contact, a new contact will be created and simultaneously will be considered as the requester of the ticket.",
            helpText: "The email ID of a person requesting to create a ticket Note: If you specify the email address or requester ID of an existing contact, he/she will be considered as the requester of the ticket. If you specify the email address of a new contact, a new contact will be created and simultaneously will be considered as the requester of the ticket.",
            required: true,
            type: "string",
            controlType: "text",
            isExtendedSchema: false,
          },
          
        ],
        execute: async (connection, input) => {
          try {
            let postBody = {
              subject: input.subject,
              status: input.status,
              priority: input.priority,
              description: input.description,
              email:  input.requesterEmail,
            };

            var url = `https://${connection.input.domain}.freshdesk.com/api/v2/tickets`;
            let headers = {
              'Authorization': 'Basic ' + Buffer.from(`${connection.input.apiKey}:X`).toString('base64')
    
             }
            const response = await HttpUtils.request(url, headers, null, HttpUtils.HTTPMethods.POST, postBody);

            if (response.success === true) {
              return HttpUtils.successResponse(response.body);
            } else {
              return HttpUtils.errorResponse(response.body, response.statusCode);
            }
          } catch (error) {
            console.log(error);
            return HttpUtils.errorResponse(error.message);
          }
        },

        output_fields: () => app.objectDefinitions.createTicket,

        sample_output: connection => {},

        },

        get_ticket: {
          description: "Get a ticket",
          hint: "Get a particular <b>ticket</b> via <b>ID</b>",
          input_fields: () => [
            {
              key: "ticketId",
              name: "Ticket ID",
              helpText:  "The ID of the ticket you want to retrieve",
              hintText: "The ID of the ticket you want to retrieve",
              required: true,
              controlType: "text",
            }

          ],
          execute: async (connection, input) => {

            try {
              var url = `https://${connection.input.domain}.freshdesk.com/api/v2/tickets/${input.ticketId}`;
              let headers = {
                'Authorization': 'Basic ' + Buffer.from(`${connection.input.apiKey}:X`).toString('base64')
      
               }
              const response = await HttpUtils.request(url, headers, null, HttpUtils.HTTPMethods.GET);
  
              if (response.success === true) {
                return HttpUtils.successResponse(response.body);
              } else {
                return HttpUtils.errorResponse(response.body, response.statusCode);
              }
            } catch (error) {
              console.log(error);
              return HttpUtils.errorResponse(error.message);
            }

          },

          output_fields:  () => app.objectDefinitions.getTicket,
          sample_output: connection  => {},



        }

       
      }, 

    triggers: {
        update_ticket: {
          description: "New ticket is updated",
          hint: "Trigger when a <b>new ticket</b> is updated via <b>Freshdesk</b>",
          type:"poll",

          input_fields: () =>[
            
          ],
          execute: async (connection, input, nextPoll) => {
            try {

              if(nextPoll == undefined)
                nextPoll =  new Date().toISOString();
              
              var url = `https://${connection.input.domain}.freshdesk.com/api/v2/tickets`;
              let headers = {
                'Authorization': 'Basic ' + Buffer.from(`${connection.input.apiKey}:X`).toString('base64')
      
               }
              let queryParams={
                updated_since:(nextPoll == undefined)? new Date().toISOString() : nextPoll,
                order_by: 'updated_at',
                order_type: 'asc',
              }

              const response = await HttpUtils.request(url, headers, queryParams);
              console.log(response)

              if (response.success === true)  {
                let eventList=[];
                let date=nextPoll;
                if(response.body.length > 0){
                
                  let data = response.body
                  date=data.at(-1)["updated_at"];
                  eventList=response.body;
                }
                  
                return HttpUtils.successResponse({
                  events: eventList,
                  nextPoll : date
                });
                } else {
                 return HttpUtils.errorResponse(response.body, response.statusCode);
                }
              
            } catch (error) {
              console.log(error);
              return HttpUtils.errorResponse(error.message);
            }
          },

          dedup : (message) =>{
            return message.id;
          },

          output_fields: () => []
        },
    },
    test : async (connection, input) => {
      try{
         let url = `https://${connection.input.domain}.freshdesk.com/api/v2/account`
         let headers = {
          'Authorization': 'Basic ' + Buffer.from(`${connection.input.apiKey}:X`).toString('base64')

         }
        let response= await HttpUtils.request(url,  headers, null, 'GET');

        if (response.success == true) {
          return HttpUtils.successResponse(response.body);
        } else {
          return HttpUtils.errorResponse(response.message, response.statusCode);
        }
      }catch(error){
        return HttpUtils.errorResponse(error.message)
      }
     
    },
    objectDefinitions: {
      
      createTicket: [
        {
          "key": "cc_emails",
          "name": "Cc Emails",
          "hintText": "Cc Emails",
          "helpText": "Cc Emails",
          "isExtendedSchema": false,
          "required": false,
          "type": "string",
          "controlType": "text"
        },
        {
          "key": "fwd_emails",
          "name": "Fwd Emails",
          "hintText": "Fwd Emails",
          "helpText": "Fwd Emails",
          "isExtendedSchema": false,
          "required": false,
          "type": "string",
          "controlType": "text"
        },
        {
          "key": "reply_cc_emails",
          "name": "Reply Cc Emails",
          "hintText": "Reply Cc Emails",
          "helpText": "Reply Cc Emails",
          "isExtendedSchema": false,
          "required": false,
          "type": "string",
          "controlType": "text"
        },
        {
          "key": "ticket_cc_emails",
          "name": "Ticket Cc Emails",
          "hintText": "Ticket Cc Emails",
          "helpText": "Ticket Cc Emails",
          "isExtendedSchema": false,
          "required": false,
          "type": "string",
          "controlType": "text"
        },
        {
          "key": "fr_escalated",
          "name": "Fr Escalated",
          "hintText": "Fr Escalated",
          "helpText": "Fr Escalated",
          "isExtendedSchema": false,
          "required": false,
          "type": "boolean",
          "controlType": "select",
          "pickList": [
            [
              "Yes",
              true
            ],
            [
              "No",
              false
            ]
          ]
        },
        {
          "key": "spam",
          "name": "Spam",
          "hintText": "Spam",
          "helpText": "Spam",
          "isExtendedSchema": false,
          "required": false,
          "type": "boolean",
          "controlType": "select",
          "pickList": [
            [
              "Yes",
              true
            ],
            [
              "No",
              false
            ]
          ]
        },
        {
          "key": "email_config_id",
          "name": "Email Config Id",
          "hintText": "Email Config Id",
          "helpText": "Email Config Id",
          "isExtendedSchema": false,
          "required": false,
          "type": "number",
          "controlType": "text"
        },
        {
          "key": "priority",
          "name": "Priority",
          "hintText": "Priority",
          "helpText": "Priority",
          "isExtendedSchema": false,
          "required": false,
          "type": "number",
          "controlType": "text"
        },
        {
          "key": "requester_id",
          "name": "Requester Id",
          "hintText": "Requester Id",
          "helpText": "Requester Id",
          "isExtendedSchema": false,
          "required": false,
          "type": "number",
          "controlType": "text"
        },
        {
          "key": "source",
          "name": "Source",
          "hintText": "Source",
          "helpText": "Source",
          "isExtendedSchema": false,
          "required": false,
          "type": "number",
          "controlType": "text"
        },
        {
          "key": "status",
          "name": "Status",
          "hintText": "Status",
          "helpText": "Status",
          "isExtendedSchema": false,
          "required": false,
          "type": "number",
          "controlType": "text"
        },
        {
          "key": "subject",
          "name": "Subject",
          "hintText": "Subject",
          "helpText": "Subject",
          "isExtendedSchema": false,
          "required": false,
          "type": "string",
          "controlType": "text"
        },
        {
          "key": "product_id",
          "name": "Product Id",
          "hintText": "Product Id",
          "helpText": "Product Id",
          "isExtendedSchema": false,
          "required": false,
          "type": "number",
          "controlType": "text"
        },
        {
          "key": "id",
          "name": "Id",
          "hintText": "Id",
          "helpText": "Id",
          "isExtendedSchema": false,
          "required": false,
          "type": "number",
          "controlType": "text"
        },
        {
          "key": "due_by",
          "name": "Due By",
          "hintText": "Due By",
          "helpText": "Due By",
          "isExtendedSchema": false,
          "required": false,
          "type": "string",
          "controlType": "text"
        },
        {
          "key": "fr_due_by",
          "name": "Fr Due By",
          "hintText": "Fr Due By",
          "helpText": "Fr Due By",
          "isExtendedSchema": false,
          "required": false,
          "type": "string",
          "controlType": "text"
        },
        {
          "key": "is_escalated",
          "name": "Is Escalated",
          "hintText": "Is Escalated",
          "helpText": "Is Escalated",
          "isExtendedSchema": false,
          "required": false,
          "type": "boolean",
          "controlType": "select",
          "pickList": [
            [
              "Yes",
              true
            ],
            [
              "No",
              false
            ]
          ]
        },
        {
          "key": "description",
          "name": "Description",
          "hintText": "Description",
          "helpText": "Description",
          "isExtendedSchema": false,
          "required": false,
          "type": "string",
          "controlType": "text"
        },
        {
          "key": "description_text",
          "name": "Description Text",
          "hintText": "Description Text",
          "helpText": "Description Text",
          "isExtendedSchema": false,
          "required": false,
          "type": "string",
          "controlType": "text"
        },
        {
          "key": "custom_fields",
          "name": "Custom Fields",
          "hintText": "Custom Fields",
          "helpText": "Custom Fields",
          "isExtendedSchema": false,
          "required": false,
          "type": "object",
          "controlType": "object",
          "properties": []
        },
        {
          "key": "created_at",
          "name": "Created At",
          "hintText": "Created At",
          "helpText": "Created At",
          "isExtendedSchema": false,
          "required": false,
          "type": "string",
          "controlType": "text"
        },
        {
          "key": "updated_at",
          "name": "Updated At",
          "hintText": "Updated At",
          "helpText": "Updated At",
          "isExtendedSchema": false,
          "required": false,
          "type": "string",
          "controlType": "text"
        },
        {
          "key": "tags",
          "name": "Tags",
          "hintText": "Tags",
          "helpText": "Tags",
          "isExtendedSchema": false,
          "required": false,
          "type": "string",
          "controlType": "text"
        },
        {
          "key": "attachments",
          "name": "Attachments",
          "hintText": "Attachments",
          "helpText": "Attachments",
          "isExtendedSchema": false,
          "required": false,
          "type": "string",
          "controlType": "text"
        },
        {
          "key": "form_id",
          "name": "Form Id",
          "hintText": "Form Id",
          "helpText": "Form Id",
          "isExtendedSchema": false,
          "required": false,
          "type": "number",
          "controlType": "text"
        },
        {
          "key": "nr_escalated",
          "name": "Nr Escalated",
          "hintText": "Nr Escalated",
          "helpText": "Nr Escalated",
          "isExtendedSchema": false,
          "required": false,
          "type": "boolean",
          "controlType": "select",
          "pickList": [
            [
              "Yes",
              true
            ],
            [
              "No",
              false
            ]
          ]
        }
      ],
      getTicket: [
        {
          "key": "fr_escalated",
          "name": "Fr Escalated",
          "hintText": "Fr Escalated",
          "helpText": "Fr Escalated",
          "isExtendedSchema": false,
          "required": false,
          "type": "boolean",
          "controlType": "select",
          "pickList": [
            [
              "Yes",
              true
            ],
            [
              "No",
              false
            ]
          ]
        },
        {
          "key": "spam",
          "name": "Spam",
          "hintText": "Spam",
          "helpText": "Spam",
          "isExtendedSchema": false,
          "required": false,
          "type": "boolean",
          "controlType": "select",
          "pickList": [
            [
              "Yes",
              true
            ],
            [
              "No",
              false
            ]
          ]
        },
        {
          "key": "group_id",
          "name": "Group Id",
          "hintText": "Group Id",
          "helpText": "Group Id",
          "isExtendedSchema": false,
          "required": false,
          "type": "number",
          "controlType": "text"
        },
        {
          "key": "priority",
          "name": "Priority",
          "hintText": "Priority",
          "helpText": "Priority",
          "isExtendedSchema": false,
          "required": false,
          "type": "number",
          "controlType": "text"
        },
        {
          "key": "requester_id",
          "name": "Requester Id",
          "hintText": "Requester Id",
          "helpText": "Requester Id",
          "isExtendedSchema": false,
          "required": false,
          "type": "number",
          "controlType": "text"
        },
        {
          "key": "source",
          "name": "Source",
          "hintText": "Source",
          "helpText": "Source",
          "isExtendedSchema": false,
          "required": false,
          "type": "number",
          "controlType": "text"
        },
        {
          "key": "status",
          "name": "Status",
          "hintText": "Status",
          "helpText": "Status",
          "isExtendedSchema": false,
          "required": false,
          "type": "number",
          "controlType": "text"
        },
        {
          "key": "subject",
          "name": "Subject",
          "hintText": "Subject",
          "helpText": "Subject",
          "isExtendedSchema": false,
          "required": false,
          "type": "string",
          "controlType": "text"
        },
        {
          "key": "product_id",
          "name": "Product Id",
          "hintText": "Product Id",
          "helpText": "Product Id",
          "isExtendedSchema": false,
          "required": false,
          "type": "number",
          "controlType": "text"
        },
        {
          "key": "id",
          "name": "Id",
          "hintText": "Id",
          "helpText": "Id",
          "isExtendedSchema": false,
          "required": false,
          "type": "number",
          "controlType": "text"
        },
        {
          "key": "type",
          "name": "Type",
          "hintText": "Type",
          "helpText": "Type",
          "isExtendedSchema": false,
          "required": false,
          "type": "string",
          "controlType": "text"
        },
        {
          "key": "due_by",
          "name": "Due By",
          "hintText": "Due By",
          "helpText": "Due By",
          "isExtendedSchema": false,
          "required": false,
          "type": "string",
          "controlType": "text"
        },
        {
          "key": "fr_due_by",
          "name": "Fr Due By",
          "hintText": "Fr Due By",
          "helpText": "Fr Due By",
          "isExtendedSchema": false,
          "required": false,
          "type": "string",
          "controlType": "text"
        },
        {
          "key": "is_escalated",
          "name": "Is Escalated",
          "hintText": "Is Escalated",
          "helpText": "Is Escalated",
          "isExtendedSchema": false,
          "required": false,
          "type": "boolean",
          "controlType": "select",
          "pickList": [
            [
              "Yes",
              true
            ],
            [
              "No",
              false
            ]
          ]
        },
        {
          "key": "description",
          "name": "Description",
          "hintText": "Description",
          "helpText": "Description",
          "isExtendedSchema": false,
          "required": false,
          "type": "string",
          "controlType": "text"
        },
        {
          "key": "description_text",
          "name": "Description Text",
          "hintText": "Description Text",
          "helpText": "Description Text",
          "isExtendedSchema": false,
          "required": false,
          "type": "string",
          "controlType": "text"
        },
        {
          "key": "custom_fields",
          "name": "Custom Fields",
          "hintText": "Custom Fields",
          "helpText": "Custom Fields",
          "isExtendedSchema": false,
          "required": false,
          "type": "object",
          "controlType": "object",
          "properties": []
        },
        {
          "key": "created_at",
          "name": "Created At",
          "hintText": "Created At",
          "helpText": "Created At",
          "isExtendedSchema": false,
          "required": false,
          "type": "string",
          "controlType": "text"
        },
        {
          "key": "updated_at",
          "name": "Updated At",
          "hintText": "Updated At",
          "helpText": "Updated At",
          "isExtendedSchema": false,
          "required": false,
          "type": "string",
          "controlType": "text"
        },
        {
          "key": "tags",
          "name": "Tags",
          "hintText": "Tags",
          "helpText": "Tags",
          "isExtendedSchema": false,
          "required": false,
          "type": "string",
          "controlType": "text"
        },
        {
          "key": "attachments",
          "name": "Attachments",
          "hintText": "Attachments",
          "helpText": "Attachments",
          "isExtendedSchema": false,
          "required": false,
          "type": "string",
          "controlType": "text"
        },
        {
          "key": "sentiment_score",
          "name": "Sentiment Score",
          "hintText": "Sentiment Score",
          "helpText": "Sentiment Score",
          "isExtendedSchema": false,
          "required": false,
          "type": "number",
          "controlType": "text"
        },
        {
          "key": "initial_sentiment_score",
          "name": "Initial Sentiment Score",
          "hintText": "Initial Sentiment Score",
          "helpText": "Initial Sentiment Score",
          "isExtendedSchema": false,
          "required": false,
          "type": "number",
          "controlType": "text"
        },
        {
          "key": "nr_escalated",
          "name": "Nr Escalated",
          "hintText": "Nr Escalated",
          "helpText": "Nr Escalated",
          "isExtendedSchema": false,
          "required": false,
          "type": "boolean",
          "controlType": "select",
          "pickList": [
            [
              "Yes",
              true
            ],
            [
              "No",
              false
            ]
          ]
        }
      ]
    },
    pickLists : {
     
    }
};

module.exports = app;