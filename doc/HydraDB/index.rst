Hydra database schema
=====================

Hydra data
----------

Network definition
******************

  ====================== ================================================================
  **Table**              **Description**
  ---------------------- ----------------------------------------------------------------
  tProject               A project is a high level container for networks.
  tNetwork               A network contains nodes, links and scenarios
  tNode                  Nodes are independent of networks
  tLink                  Links belong inside a network and link two nodes. Links essentially define the network's topology.
  ====================== ================================================================

Attributes
**********

  ====================== ================================================================
  **Table**              **Description**
  ---------------------- ----------------------------------------------------------------
  tResourceAttr          
  tAttr                  
  tResourceTemplateItem  
  tResourceTemplate      
  tResourceTemplateGroup 
  tAttrMap               
  ====================== ================================================================

Datasets
********

  ====================== ================================================================
  **Table**              **Description**
  ---------------------- ----------------------------------------------------------------
  tScenarioData          
  tDescriptor            
  tScalar                
  tArray                 
  tTimeSeries            
  tTimeSeriesData        
  tEqTimeSeries          
  tDataAttr              
  ====================== ================================================================

Scenarios
*********

  ====================== ================================================================
  **Table**              **Description**
  ---------------------- ----------------------------------------------------------------
  tScenario              
  tResourceScenario      
  ====================== ================================================================

Rules and constraints
*********************

  ====================== ================================================================
  **Table**              **Description**
  ---------------------- ----------------------------------------------------------------
  tConstraint            
  tConstraintGroup       
  tConstraintItem        
  ====================== ================================================================


User and permission managment
-----------------------------

These tables are not connected to the ones containing network information.

  ========================= =============================================================
  **Table**                 **Description**
  ------------------------- -------------------------------------------------------------
  tUser                     Save access credentials for each user
  tRoleUser                 Assign each user to specific roles
  tRole                     Define roles
  tRolePerm                 Assign particular permissions to a role
  tPerm                     Define particular permissions
  ========================= =============================================================
