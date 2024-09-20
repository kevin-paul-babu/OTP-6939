/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/email', 'N/record', 'N/search', 'N/ui/serverWidget','N/file','N/redirect'],
    /**
 * @param{email} email
 * @param{record} record
 * @param{search} search
 * @param{serverWidget} serverWidget
 * @param{file} file
 *  @param{redirect} redirect
 */
    (email, record, search, serverWidget, file,redirect) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        function EmployeeSearch(){
            try {
               let searchObj = search.create({
                   type: search.Type.EMPLOYEE,
                   filters:  ["isinactive","any","F"],
                   columns: ['entityid','internalid']
               })
               let results = searchObj.run().getRange({
                start: 0,
                end: 1000
            });
            //    log.debug("results",results)
                return results;
               
               
            } catch (e) {
               log.error("error",e.message)
            }
           }
        function createCsvFile(request,lineCount){
            let docNo ;
            let vendor;let memo;
            let total;
            //let fileId;
            let csvContent = 'DocumentNo,Vendor,Memo,Amount\n';
            for(let i=0;i<lineCount;i++){
                let select = request.getSublistValue({
                    group: "custpage_jj_porder",
                    line:i,
                    name: "custpage_jj_sub_porder_select"
                });
                log.debug("select",select);
                if(select ==='T'){
                docNo = request.getSublistValue({
                    group: "custpage_jj_porder",
                    line:i,
                    name: "custpage_jj_sub_porder_docno"
                });
                vendor  = request.getSublistValue({
                    group: "custpage_jj_porder",
                    line:i,
                    name:"custpage_jj_sub_porder_vendor"
                });
               
                memo  = request.getSublistValue({
                    group: "custpage_jj_porder",
                    line:i,
                    name: "custpage_jj_sub_porder_memo"
                });
              
               total  = request.getSublistValue({
                    group: "custpage_jj_porder",
                    line:i,
                    name: "custpage_jj_sub_porder_total"
                });
                csvContent +=docNo+','+vendor+','+memo+','+total+"\n";
              
                } 
           

              
              
            }
           
            return csvContent;
        }
        function sendEmailToSupervisor(supervisor,csvFileId,supervisorName){
            email.send({
                author:-5 ,
                body: "Dear SuperVisor ,Here are the orders that are pending this month",
                recipients:supervisor,
                subject:"Pending Billed Purchase Orders",
                attachments:[file.load({
                    id: csvFileId
                })]
            })
            
            let body = "Email Sent to "+supervisorName;
            return body;
        }
        function fetchSearchResult(pagedData,pageIndex) {

        try {
            let searchPage = pagedData.fetch({
                index : pageIndex
            });
            // log.debug("")
        let results = new Array();

        searchPage.data.forEach(function (result) {
           
            results.push({
                "docno":result.getValue({name: "tranid", label: "Document Number"}),
                "vendor": result.getValue({ name: "entityid",
                    join: "vendor",
                    label: "Name"}),
                "memo":result.getValue({ name: "memo", label: "Memo"}),
                "total":result.getValue({ name: "amount", label: "Amount"})
            });
            return true;
        });
        return results;
        } catch (e) {
            log.error("Error on Fetch Search Results",e.message)
        }
        }
        const onRequest = (scriptContext) => {
        try{
               
            if(scriptContext.request.method === "GET"){
                let form = serverWidget.createForm({
                    title: "Email Report",
                });
                form.addFieldGroup({
                    id: "custpage_jj_filter",
                    label: "FIlter"
                })
                form.addFieldGroup({
                    id: "custpage_jj_page_group",
                    label: "Page Group"
                })
                form.clientScriptFileId = 3253;
                let employee = form.addField({
                    id: "custpage_jj_employee",
                    label: "Select a Employee",
                    type: serverWidget.FieldType.SELECT,
                    container: "custpage_jj_filter"
                });
                let results = EmployeeSearch();
                employee.addSelectOption({
                    value: "",
                    text: "",
                });
                for(let i =0;i<results.length;i++){
                    employee.addSelectOption({
                        value: results[i].getValue({
                            name: "internalid"
                        }),
                        text:  results[i].getValue({
                            name: "entityid"
                        })
                    })
                }
              
                form.addButton({
                    id: "custpage_jj_get_values_button",
                    label: "Get Values",
                    functionName: 'setValues'
                });
                form.addSubmitButton({
                    label: "Send Email"
                })
                let subList = form.addSublist({
                    id: "custpage_jj_porder",
                    label: "Purchase Order",
                    type: serverWidget.SublistType.LIST
                });
                subList.addField({
                    id: "custpage_jj_sub_porder_docno",
                    label: "Document No",
                    type: serverWidget.FieldType.INTEGER,
                })
                subList.addField({
                    id: "custpage_jj_sub_porder_vendor",
                    label: "Vendor",
                    type: serverWidget.FieldType.TEXT,
                  
                })
                let memo = subList.addField({
                    id: "custpage_jj_sub_porder_memo",
                    label: "Memo",
                    type: serverWidget.FieldType.TEXT,
                  
                })
                subList.addField({
                    id: "custpage_jj_sub_porder_total",
                    label: "Total Amount",
                    type: serverWidget.FieldType.CURRENCY,
                })
                subList.addField({
                    id: "custpage_jj_sub_porder_select",
                    label: "Select",
                    type: serverWidget.FieldType.CHECKBOX,
                    
                })
                let selectOptions = form.addField({
                    id : 'custpage_jj_pageid',
                    label : 'Page Index',
                    type : serverWidget.FieldType.SELECT,
                    container:"custpage_jj_page_group"
                });
                let employeeId = scriptContext.request.parameters.empId||'';
                
                employee.defaultValue = employeeId;
                // const pageSize  = 10;
                log.debug("empid",employeeId);
                if(employeeId){
                    let purchaseorderSearchObj = search.create({
                        type: "purchaseorder",
                        settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
                        filters:
                        [
                           ["type","anyof","PurchOrd"], 
                           "AND", 
                           ["mainline","is","T"], 
                           "AND", 
                           ["datecreated","within","thismonth"], 
                           "AND", 
                           ["status","anyof","PurchOrd:F"], 
                           "AND", 
                           ["createdby","anyof",employeeId]
                        ],
                        columns:
                        [
                           search.createColumn({name: "tranid", label: "Document Number"}),
                           search.createColumn({
                              name: "entityid",
                              join: "vendor",
                              label: "Name"
                           }),
                           search.createColumn({name: "memo", label: "Memo"}),
                           search.createColumn({name: "amount", label: "Amount"}),
                           search.createColumn({name: "datecreated", label: "Date Created"}),
                           search.createColumn({name: "createdby", label: "Created By"})
                        ]
                     });
                     let searchResults  = purchaseorderSearchObj.run();
                    
                     let results = purchaseorderSearchObj.run().getRange({
                        start:0,
                        end:1000
                     });
                     log.debug("resultsearch",searchResults);
                     let pageSize = 10;
                     let pagedData = purchaseorderSearchObj.runPaged({ pageSize: pageSize });
                     let searchResultCount = pagedData.count;
                    log.debug("purchaseorderSearchObj result count",searchResultCount);
                   
                    let pageId = parseInt(scriptContext.request.parameters.pageid)||0;   
                     let pageCount = Math.ceil(searchResultCount / pageSize);
                     log.debug("pageCount",pageCount);
                   
                     if (pageCount === 0) {
                        alert("No Results Found")
                      } else {
                        
                        if (pageId < 0 || pageId >= pageCount) {
                          pageId = 0;
                        }
                        else if (pageId >= pageCount)
                            pageId = pageCount - 1;

                        if (pageId != 0) {
                            form.addButton({
                                id : 'custpage_previous',
                                label : 'Previous',
                                functionName : 'getSuiteletPage(' + (pageId - 1) +')',
                                container:'custpage_jj_page_group'
                            });
                        }
            
                        if (pageId != pageCount - 1) {
                            form.addButton({
                                id : 'custpage_next',
                                label : 'Next',
                                functionName : 'getSuiteletPage(' +(pageId + 1) + ')',
                                container:'custpage_jj_page_group'
                            });
                        }
                        
                        let addResults = fetchSearchResult(pagedData, pageId);
                        log.debug("array result",addResults);
                        var j = 0;
                        addResults.forEach(function (result) {
                           subList.setSublistValue({
                               id: "custpage_jj_sub_porder_docno",
                               line: j,
                               value: result.docno
                           });
                           subList.setSublistValue({
                               id: "custpage_jj_sub_porder_vendor",
                               line: j,
                               value: result.vendor
                           });
                           subList.setSublistValue({
                               id: "custpage_jj_sub_porder_memo",
                               line: j,
                               value: result.memo
                           });
                           memo.updateDisplayType({
                               displayType : serverWidget.FieldDisplayType.ENTRY
                           });
                           subList.setSublistValue({
                               id: "custpage_jj_sub_porder_total",
                               line: j,
                               value: result.total
                           });
                           j++;
                       })
                }
                   
                     for (let i = 0; i < pageCount; i++) {
                    if (i == pageId) {
                        selectOptions.addSelectOption({
                            value : 'pageid_' + i,
                            text : ((i * pageSize) + 1) + ' - ' + ((i + 1) * pageSize),
                            isSelected:true
                        });
                        // redirect.toSuitelet({
                        //     scriptId: "customscript_jj_sl_email_sup_otp7939",
                        //     deploymentId: "customdeploy_jj_sl_email_sup_otp7939",
                        //     parameters:{
                        //         pageid : pageId
                        //     }
                        // })
                    } else {
                        selectOptions.addSelectOption({
                            value : 'pageid_' + i,
                            text : ((i * pageSize) + 1) + ' - ' + ((i + 1) * pageSize)
                        });
                    }
                    log.debug("'pageid_' "+ i)
                    }
                

             }
             scriptContext.response.writePage(form);     
    }else{
        let request = scriptContext.request;
      
        let lineCount = request.getLineCount({
            group: "custpage_jj_porder"
        });
        let csvFile;
        let body;
        let employeeId = scriptContext.request.parameters.custpage_jj_employee;
        let lookupSearchObj  = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: employeeId,
            columns: ['supervisor']
            });
            let supervisor = lookupSearchObj.supervisor[0].value;
            let supervisorName = lookupSearchObj.supervisor[0].text;
            log.debug("supervisor",supervisor);
            log.debug("supervisor",supervisorName);
            let csvFileId;
        if(lineCount>0){
            csvFile = createCsvFile(request,lineCount);
            log.debug("csv",csvFile);
            let csvDocument = file.create({
                name: "Pending Billed Purchase Orders"+employeeId,
                fileType: file.Type.CSV,
                contents: csvFile,
                folder: -15,
                isOnline: true
            })
             csvFileId = csvDocument.save();
           //body    = sendEmailToSupervisor(supervisor,csvFileId,supervisorName)
        } 
        //let finalText = "CsvContent"+csvFile+"\n"+body;
        scriptContext.response.write(csvFileId);     
    }


        }catch(e){
         log.error("error",e.message+e.stack);
        }

}


        return {onRequest}

    });
