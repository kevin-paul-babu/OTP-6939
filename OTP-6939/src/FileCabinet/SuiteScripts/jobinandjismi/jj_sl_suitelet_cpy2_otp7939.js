/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/email', 'N/record', 'N/search', 'N/ui/serverWidget','N/file','N/encode','N/format'],
    /**
 * @param{email} email
 * @param{record} record
 * @param{search} search
 * @param{serverWidget} serverWidget
 * @param{file} file
 *  @param{encode} encode
 *  @param{format} format
 */
    (email, record, search, serverWidget, file,encode,format) => {
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
               log.error("error on employee search",e.message)
            }
           }
           function createSublistPo(arrayData){
          try {
            let recordObj = record.create({
                type:"customrecord_jj_sublist_child",
                isDynamic: true,
                defaultValues: Object
            });
            let date = new Date();
            let day  = date.getDate();
            let month = date.getMonth()+1;
            let year  = date.getFullYear();
            let currentDate = `${month}/${day}/${year}`;
            // let currentDateL = format.format({
            //     value: currentDate,
            //     type: format.Type.DATE
            // })
            // log.debug("currentDate",currentDateL);
            // recordObj.setValue({
            //     fieldId: "custrecord_jj_sub_date",
            //     value: currentDateL,
            //     ignoreFieldChange: true
            // })
            for(let i =0;i<arrayData.length;i++){
               
                recordObj.setValue({
                    fieldId: "custrecord_jj_sub_doc",
                    value: arrayData[i].docno,
                    ignoreFieldChange: true
                })
                let reason = arrayData[i].reason;
                log.debug("reason",reason);
                recordObj.setValue({
                    fieldId: "custrecord_jj_sub_reason_delay",
                    value: arrayData[i].reason,
                    ignoreFieldChange: true
                })
                recordObj.setValue({
                    fieldId: "custrecord_jj_po_id",
                    value: arrayData[i].internalid,
                    ignoreFieldChange: true
                })
                recordObj.save();

            }
          } catch (e) {
            log.error("Error on customrecord",e.message+e.stack)
          }
           }
           function createXlsxFile(arrayData,employeeId){
            try {
                let XML='';
                XML += '<?xml version="1.0"?>';
                XML += '<?mso-application progid="Excel.Sheet"?>';
                XML += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"';
                XML += ' xmlns:o="urn:schemas-microsoft-com:office:office"';
                XML += ' xmlns:x="urn:schemas-microsoft-com:office:excel"';
                XML += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
                XML += '<Styles>';
                XML += '  <Style ss:ID="Default" ss:Name="Normal">';
                XML += '    <Alignment ss:Vertical="Bottom"/>';
                XML += '    <Font ss:FontName="Arial" ss:Size="11" ss:Color="#000000"/>';
                XML += '  </Style>';
                XML += '  <Style ss:ID="Header">';
                XML += '    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>';
                XML += '    <Font ss:Bold="1" ss:Color="#FFFFFF"/>';
                XML += '    <Interior ss:Color="#AAAAAA" ss:Pattern="Solid"/>';
                XML += '  </Style>';
                XML += '<Style ss:ID="s156">'; 
                XML += '<Alignment ss:Horizontal="Center" ss:Vertical="Center"/> ';
                XML +='<Borders/>';
                XML +=' <Font ss:FontName="Times New Roman" x:Family="Roman" ss:Color="#000000"/> <Interior/> </Style>'
                XML += '</Styles>';
    
                XML += '<Worksheet ss:Name="Sheet1">';
                XML += '  <Table>';
                XML += '    <Row>';
                XML += '      <Cell ss:StyleID="Header"><Data ss:Type="String">Document No</Data></Cell>';
                XML += '      <Cell ss:StyleID="Header"><Data ss:Type="String">Vendor</Data></Cell>';
                XML += '      <Cell ss:StyleID="Header"><Data ss:Type="String">Memo</Data></Cell>';
                XML += '      <Cell ss:StyleID="Header"><Data ss:Type="String">Reason for Delay</Data></Cell>';
                XML += '      <Cell ss:StyleID="Header"><Data ss:Type="String">Total</Data></Cell>';
                XML += '    </Row>';
                for(let i =0;i<arrayData.length;i++){
                XML += ' <Row>';
                XML += ' <Cell ss:StyleID="s156"><Data ss:Type="Number">' + arrayData[i].docno + '</Data></Cell>';
                XML += ' <Cell ss:StyleID="s156"><Data ss:Type="String">' + arrayData[i].vendor + '</Data></Cell>';
                XML += ' <Cell ss:StyleID="s156"><Data ss:Type="String">' + arrayData[i].memo + '</Data></Cell>';
                XML += ' <Cell ss:StyleID="s156"><Data ss:Type="String">' + arrayData[i].reason + '</Data></Cell>';
                XML += ' <Cell ss:StyleID="s156"><Data ss:Type="Number">' + arrayData[i].total + '</Data></Cell>';
                XML += ' </Row>';
                }
                XML += ' </Table>';
                XML += '</Worksheet>';
                XML += '</Workbook>';
                
                 
                log.debug("xml",XML);
                let base64EncodedString = encode.convert({
                    string: XML,
                    inputEncoding: encode.Encoding.UTF_8,
                    outputEncoding: encode.Encoding.BASE_64
                });
                let xlsFile = file.create({
                    name: 'Pending Purchase Orders' + employeeId + '.xls',
                    fileType: 'EXCEL',
                    contents: base64EncodedString,
                    folder: -15,
                    isOnline:true
                });
                let xlsFileId = xlsFile.save();
                return xlsFileId;   
            } catch (e) {
                log.error("Error pn xlsx ",e.message+e.stack)
            }

            // let csvContent = 'DocumentNo,Vendor,Memo,Amount\n';
        
          
        }
        // function createCsvFile(request,lineCount){
        //     let docNo ;
        //     let vendor;let memo;
        //     let total;
        //     //let fileId;
        //     let csvContent = 'DocumentNo,Vendor,Memo,Amount\n';
        //     for(let i=0;i<lineCount;i++){
        //         let select = request.getSublistValue({
        //             group: "custpage_jj_porder",
        //             line:i,
        //             name: "custpage_jj_sub_porder_select"
        //         });
        //         log.debug("select",select);
        //         if(select ==='T'){
        //         docNo = request.getSublistValue({
        //             group: "custpage_jj_porder",
        //             line:i,
        //             name: "custpage_jj_sub_porder_docno"
        //         });
        //         vendor  = request.getSublistValue({
        //             group: "custpage_jj_porder",
        //             line:i,
        //             name:"custpage_jj_sub_porder_vendor"
        //         });
               
        //         memo  = request.getSublistValue({
        //             group: "custpage_jj_porder",
        //             line:i,
        //             name: "custpage_jj_sub_porder_memo"
        //         });
              
        //        total  = request.getSublistValue({
        //             group: "custpage_jj_porder",
        //             line:i,
        //             name: "custpage_jj_sub_porder_total"
        //         });
        //         csvContent +=docNo+','+vendor+','+memo+','+total+"\n";
              
        //         } 
           

              
              
        //     }
           
        //     return csvContent;
        // }
        
        function SearchResults(employeeId,pageId){
            try {
                   
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
                    [  search.createColumn({name: "internalid", label: "Internal ID"}),
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
                 
                //  log.debug("resultsearch",searchResults);
                 let pageSize = 10;
                 let pagedData = purchaseorderSearchObj.runPaged({ pageSize: pageSize });
                 let searchResultCount = pagedData.count;
                 log.debug("purchaseorderSearchObj result count",searchResultCount);
                 //selectOptions.defaultValue = pageId;
                     let pageCount = Math.ceil(searchResultCount / pageSize);
                     log.debug("pageCount",pageCount);
                    let currentPage;
                     if (pageCount === 0) {
                        alert("No Results Found");
                      } else {
                        
                        if (pageId < 0 || pageId >= pageCount) {
                          pageId = 0;
                        }
                        currentPage = pagedData.fetch({
                            index : pageId
                        });
                        return {
                            currentPage:currentPage,
                            pageCount:pageCount,
                            pageid:pageId
                        }
                       
                }
                

            } catch (e) {
                log.error("Error on Search Results",e.message+e.stack)
            }
        }
        function sendEmailToSupervisor(supervisor,csvFileId,supervisorName){
          try {
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
          } catch (e) {
            log.error("Error on sending email",e.message+e.stack)
          }
        }
        function fetchSearchResult(pagedData) {

        try {
            // let searchPage = pagedData.fetch({
            //     index : pageIndex
            // });
            // log.debug("")
        let results = new Array();

        for(let i =0;i<pagedData.length;i++){
           
            results.push({
                "docno":pagedData[i].getValue({name: "tranid", label: "Document Number"}),
                "vendor": pagedData[i].getValue({ name: "entityid",
                    join: "vendor",
                    label: "Name"}),
                "memo":pagedData[i].getValue({ name: "memo", label: "Memo"}),
                "total":pagedData[i].getValue({ name: "amount", label: "Amount"})
            });
            
        }
        log.debug("results",results);
        return results;
        } catch (e) {
            log.error("Error on Fetch Search Results",e.message)
        }
        }
        function getDataValues(request,lineCount){
           try {
            let dataDetails =[];
            for(let i=0;i<lineCount;i++){
                let select = request.getSublistValue({
                    group: "custpage_jj_porder",
                    line:i,
                    name: "custpage_jj_sub_porder_select"
                });
                log.debug("select",select);
                if(select ==='T'){
                    let docNo = request.getSublistValue({
                        group: "custpage_jj_porder",
                        line:i,
                        name: "custpage_jj_sub_porder_docno"
                    });
                    let searchObj = search.create({
                        type: "purchaseorder",
                        filters: ["tranid","is",docNo],
                        columns: ['internalid']
                    })
                    let results = searchObj.run().getRange({
                        start:0,
                        end:1
                    });
                    let invId=0;
                    results.forEach(function(result){
                        invId = result.getValue('internalid');
                        log.debug(invId);
                    });
                dataDetails.push({
                    internalid:invId,
                    docno:request.getSublistValue({
                        group: "custpage_jj_porder",
                        line:i,
                        name: "custpage_jj_sub_porder_docno"
                    }),
                    
                    vendor: request.getSublistValue({
                        group: "custpage_jj_porder",
                        line:i,
                        name:"custpage_jj_sub_porder_vendor"
                    }),
                    memo :request.getSublistValue({
                        group: "custpage_jj_porder",
                        line:i,
                        name: "custpage_jj_sub_porder_memo"
                    }),
                    reason:request.getSublistValue({
                        group: "custpage_jj_porder",
                        line:i,
                        name: "custpage_jj_sub_porder_reason"
                    }),
                    total:request.getSublistValue({
                        group: "custpage_jj_porder",
                        line:i,
                        name: "custpage_jj_sub_porder_total"
                    })
                });
                } 
            }
            log.debug("array",dataDetails);
            return dataDetails;   
           } catch (e) {
            log.error("Error on get Values Results",e.message+e.stack)
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
                form.clientScriptFileId = 3259;
                // form.clientScriptModulePath='SuiteScripts/jobinandjismi/jj_sl_suitelet_cpy2_otp7939.js';
               
                let employeeId = scriptContext.request.parameters.empId||'';
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
                //employee.isMandatory = true;
              
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
                let reason = subList.addField({
                    id: "custpage_jj_sub_porder_reason",
                    label: "Reason",
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
               
                let pageId = scriptContext.request.parameters.pageid||0;   
                    log.debug("pageId",pageId)
                    
                
                 const pageSize  = 10;
                log.debug("empid",employeeId);
                if(employeeId && pageId>=0){
                     employee.defaultValue = employeeId;
                    selectOptions.defaultValue = pageId;
                    let searchData = SearchResults(employeeId,pageId)
                    log.debug("sear",searchData);
                    let searchPage;
                    let totalLines;
                    searchPage = searchData.currentPage.data;
                    log.debug("currentPage",searchPage);
                    totalLines = searchData.pageCount;
                    let pageid = searchData.pageid;
                    let results = fetchSearchResult(searchPage);
                    log.debug("results",results);
                    for(let j =0;j<results.length;j++) {
                           subList.setSublistValue({
                               id: "custpage_jj_sub_porder_docno",
                               line: j,
                               value: results[j].docno
                           });
                           subList.setSublistValue({
                               id: "custpage_jj_sub_porder_vendor",
                               line: j,
                               value: results[j].vendor
                           });
                           subList.setSublistValue({
                               id: "custpage_jj_sub_porder_memo",
                               line: j,
                               value: results[j].memo
                           });
                           reason.updateDisplayType({
                               displayType : serverWidget.FieldDisplayType.ENTRY
                           });
                           subList.setSublistValue({
                               id: "custpage_jj_sub_porder_total",
                               line: j,
                               value: results[j].total
                           });    
                }
                        for(let j = 0; j < totalLines; j++){
                            selectOptions.addSelectOption({
                                value: j,
                                text: j+1
                            });
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
            let status ;
        if(lineCount>0){
            arrayData = getDataValues(request,lineCount);
            excelFile = createXlsxFile(arrayData,employeeId);
            status    = createSublistPo(arrayData);
           body    = sendEmailToSupervisor(supervisor,excelFile,supervisorName)
        } 
        //let finalText = "CsvContent"+csvFile+"\n"+body;
        scriptContext.response.write(body);     
    }


        }catch(e){
         log.error("error on OnRequest",e.message+e.stack);
        }

}


        return {onRequest}

    });