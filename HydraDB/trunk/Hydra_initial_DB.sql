DROP DATABASE IF EXISTS hydra_initial;
CREATE DATABASE hydra_initial;

USE hydra_initial;

/* Project network and scenearios */

CREATE TABLE tProject (
    project_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    project_name VARCHAR(45),
    project_description VARCHAR(1000)
);

CREATE TABLE tNetwork (
    network_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    network_name VARCHAR(45),
    network_description VARCHAR(1000),
    project_id INT,
    FOREIGN KEY (project_id) REFERENCES tProject(project_id)
);

CREATE TABLE tNode (
    node_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    node_type VARCHAR(45),
    node_name VARCHAR(45),
    node_x DOUBLE,
    node_y DOUBLE
);

CREATE TABLE tLink (
    link_id INT PRIMARY KEY AUTO_INCREMENT,
    link_type VARCHAR(45),
    network_id INT,
    node_1_id INT,
    node_2_id INT,
    link_name VARCHAR(45),
    FOREIGN KEY (network_id) REFERENCES tNetwork(network_id),
    FOREIGN KEY (node_1_id) REFERENCES tNode(node_id),
    FOREIGN KEY (node_2_id) REFERENCES tNode(node_id)
);

CREATE TABLE tScenario (
    scenario_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    scenario_name VARCHAR(45),
    scenario_description VARCHAR(1000),
    network_id INT,
    FOREIGN KEY (network_id) REFERENCES tNetwork(network_id)
);

/* Constraints */

CREATE TABLE tConstraint (
    constraint_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    scenario_id INT,
    group_id INT,
    constant DOUBLE,
    op VARCHAR(10),
    FOREIGN KEY (scenario_id) REFERENCES tScenario(scenario_id)
);

CREATE TABLE tConstraintItem (
    constraint_id INT,
    item_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    resource_attr_id INT,
    FOREIGN KEY (constraint_id) REFERENCES tConstraint(constraint_id)
);

CREATE TABLE tConstraintGroup (
    constraint_id INT,
    group_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    ref_key VARCHAR(45),
    ref_id_1 INT,
    ref_id_2 INT,
    op VARCHAR(10),
    FOREIGN KEY (ref_id_1) REFERENCES tConstraintItem(item_id),
    FOREIGN KEY (ref_id_2) REFERENCES tConstraintItem(item_id),
    FOREIGN KEY (constraint_id) REFERENCES tConstraint(constraint_id)
);

/* Data representation */

CREATE TABLE tDescriptor (
    data_id INT NOT NULL PRIMARY KEY,
    desc_val VARCHAR(45)
);

CREATE TABLE tTimeSeries (
    data_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    ts_time DATETIME,
    ts_value DOUBLE
);

CREATE TABLE tTimeSeriesArray (
    ts_array_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    ts_array_data BLOB
);

CREATE TABLE tEquallySpacedTimeSeries (
    data_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    start_time DATETIME,
    frequency FLOAT,
    ts_array_id INT,
    FOREIGN KEY (ts_array_id) REFERENCES tTimeSeriesArray(ts_array_id)
);

CREATE TABLE tScalar (
    data_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    param_value DOUBLE
);

CREATE TABLE tArray (
    data_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    arr_x_dim INT,
    arr_y_dim INT,
    arr_z_dim INt,
    arr_precision VARCHAR(45),
    arr_endianness VARCHAR(45),
    arr_data BLOB
);

CREATE TABLE tDataAttr (
    d_attr_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    data_id INT,
    data_type VARCHAR(45),
    d_attr_name VARCHAR(45),
    d_attr_val DOUBLE
);

CREATE TABLE tScenarioData (
    data_id INT,
    data_type VARCHAR(45),
    data_units VARCHAR(45),
    data_name VARCHAR(45),
    data_dimen VARCHAR(45),
    PRIMARY KEY (data_id, data_type)
);

CREATE TABLE tResourceScenario (
    data_id INT,
    scenario_id INT,
    resource_attr_id INT,
    PRIMARY KEY (data_id, scenario_id),
    FOREIGN KEY (scenario_id) REFERENCES tScenario(scenario_id),
    FOREIGN KEY (data_id) REFERENCES tScenarioData(data_id)
);

/* Attributes */

CREATE TABLE tAttr (
    attr_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    attr_name VARCHAR(45),
    attr_dimen VARCHAR(45)
);

CREATE TABLE tAttrGroup (
    attr_group_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    group_name VARCHAR(45)
);

CREATE TABLE tAttrGroupItem (
    attr_id INT,
    attr_group_id INT,
    FOREIGN KEY (attr_id) REFERENCES tAttr(attr_id),
    FOREIGN KEY (attr_group_id) REFERENCES tAttrGroup(attr_group_id)
);

CREATE TABLE tAttrMap (
    attr_id_a INT,
    attr_id_b INT,
    FOREIGN KEY (attr_id_a) REFERENCES tAttr(attr_id),
    FOREIGN KEY (attr_id_b) REFERENCES tAttr(attr_id)
);

CREATE TABLE tResourceAttr (
    resource_attr_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    attr_id INT,
    ref_key VARCHAR(45),
    ref_id INT,
    attr_group_id INT,
    attr_is_var VARCHAR(1) NOT NULL,
    FOREIGN KEY (attr_id) REFERENCES tAttr(attr_id),
    FOREIGN KEY (attr_group_id) REFERENCES tAttrGroup(attr_group_id)
);

ALTER TABLE tConstraintItem ADD FOREIGN KEY (resource_attr_id) REFERENCES tResourceAttr(resource_Attr_id);

ALTER TABLE tResourceScenario ADD FOREIGN KEY (resource_attr_id) REFERENCES tResourceAttr(resource_attr_id);

/* ========================================================================= */
/* User permission management                                                */

CREATE TABLE tUser (
    user_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    username varchar(45),
    cr_date TIMESTAMP
);

CREATE TABLE tRole (
    role_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(45),
    cr_date TIMESTAMP
);

CREATE TABLE tPerm (
    perm_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    perm_name VARCHAR(45),
    cr_date TIMESTAMP
);

CREATE TABLE tRoleUser (
    user_id INT,
    role_id INT,
    FOREIGN KEY (user_id) REFERENCES tUser(user_id),
    FOREIGN KEY (role_id) REFERENCES tRole(role_id)
);

CREATE TABLE tRolePerm (
    perm_id INT,
    role_id INT,
    FOREIGN KEY (perm_id) REFERENCES tPerm(perm_id),
    FOREIGN KEY (role_id) REFERENCES tRole(role_id)
);
